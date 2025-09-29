/**
 * @file 语雀 (Yuque) Open API 访问与缓存工具
 * @description
 * - 提供获取用户公开知识库、文档列表、文档详情、目录（TOC）、搜索等功能。
 * - 统一封装请求，支持 ISR（增量静态再生）缓存时间配置。
 * - 内置基于 Promise 的 LRU 缓存（带 TTL 与失败短路）以减少详情请求压力。
 */
import 'server-only'

// 知识库（Book）模型，简化常用字段
type YuqueRepo = {
  id: number
  name: string
  slug: string
  namespace: string // 命名空间，格式为 login/slug
  description?: string
  updated_at: string
  type?: string // 资源类型，知识库通常为 'Book'
  public?: number // 是否公开，1 表示公开
}

// 文档模型（列表项）
type YuqueDoc = {
  id: number
  title: string
  slug: string
  status: number
  user_id: number
  created_at: string
  updated_at: string
  word_count?: number
  hits?: number
  likes_count?: number
  comments_count?: number
  read_count?: number
  published_at?: string
  first_published_at?: string
}

// 文档详情（含 body/body_html）
type YuqueDocDetail = YuqueDoc & {
  body?: string // 文档的 Markdown 原文内容
  body_html?: string
  format?: 'markdown' | 'lake' | string
}

// 接口基址与 Token 由环境变量注入
const BASE = process.env.YUQUE_BASE || 'https://www.yuque.com/api/v2'
const TOKEN = process.env.YUQUE_TOKEN || ''
// 统一控制对语雀 API 的 ISR 缓存时间（秒），默认 10 分钟，可通过环境变量覆盖
const FETCH_REVALIDATE = Math.max(
  0,
  Number(process.env.YUQUE_FETCH_REVALIDATE || 60 * 10) || 60 * 10,
)
const SHOULD_LOG = process.env.NODE_ENV !== 'test'

if (!TOKEN) {
  // 构建或开发时提醒，但不阻断：允许在无 Token 环境下继续构建
  console.warn('[yuque] YUQUE_TOKEN 未配置，无法调用语雀开放 API。')
}

// 带 ISR revalidate 的统一请求封装
async function yqFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`
  const headers: Record<string, string> = {
    'User-Agent': 'index-home-yuque',
    Accept: 'application/json',
  }
  if (TOKEN) headers['X-Auth-Token'] = TOKEN
  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers as any) },
    // 使用 ISR 缓存，减轻频繁请求负载
    next: { revalidate: FETCH_REVALIDATE },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`[yuque] ${res.status} ${res.statusText}: ${text}`)
  }
  const data = await res.json()
  return data.data ?? data
}

export type YuqueRawResponse = {
  status: number
  statusText: string
  text: string
}

export async function fetchYuqueRawResponse(
  path: string,
  init?: RequestInit,
): Promise<YuqueRawResponse> {
  const url = `${BASE}${path}`
  const headers: Record<string, string> = {
    'User-Agent': 'index-home-yuque-debug',
    Accept: 'application/json',
  }
  if (TOKEN) headers['X-Auth-Token'] = TOKEN
  const res = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: { ...headers, ...(init?.headers as any) },
  })
  const text = await res.text()
  return { status: res.status, statusText: res.statusText, text }
}

// 缓存：namespace -> repo id（减少重复查询）
const repoIdCache = new Map<string, number>()

// 详情缓存：LRU + TTL + 失败短路（值使用 Promise 以并发去重）
class LRUCache<K, V> {
  private max: number
  private map: Map<K, { v: V; expireAt: number }>
  private _hits = 0
  private _misses = 0
  private _sets = 0
  private _evicts = 0
  constructor(max = 200) {
    this.max = Math.max(1, max)
    this.map = new Map()
  }
  get(k: K): V | undefined {
    const entry = this.map.get(k)
    if (!entry) {
      this._misses++
      return undefined
    }
    if (Date.now() >= entry.expireAt) {
      this.map.delete(k)
      this._misses++
      return undefined
    }
    // 触发 LRU：移动到末尾
    this.map.delete(k)
    this.map.set(k, entry)
    this._hits++
    return entry.v
  }
  set(k: K, v: V, ttlMs: number) {
    const expireAt = Date.now() + Math.max(0, ttlMs)
    if (this.map.has(k)) this.map.delete(k)
    this.map.set(k, { v, expireAt })
    this._sets++
    this.ensureLimit()
  }
  private ensureLimit() {
    while (this.map.size > this.max) {
      const firstKey = this.map.keys().next().value as K
      if (firstKey === undefined) break
      this.map.delete(firstKey)
      this._evicts++
    }
  }
  get size() {
    return this.map.size
  }
  get stats() {
    return { hits: this._hits, misses: this._misses, sets: this._sets, evicts: this._evicts }
  }
}

const DEFAULT_DETAIL_TTL = Math.max(1, Number(process.env.YUQUE_DETAIL_CACHE_TTL_MS || 5 * 60_000))
const DEFAULT_FAIL_TTL = Math.max(1000, Number(process.env.YUQUE_DETAIL_FAIL_TTL_MS || 60_000))
const DEFAULT_CACHE_MAX = Math.max(50, Number(process.env.YUQUE_DETAIL_CACHE_MAX || 200))

const detailCache = new LRUCache<string, Promise<YuqueDocDetail | null>>(DEFAULT_CACHE_MAX)

export function getDetailCacheStats() {
  return { size: detailCache.size, ...detailCache.stats }
}

async function getRepoIdByNamespace(namespace: string): Promise<number | undefined> {
  if (!namespace) return undefined
  if (repoIdCache.has(namespace)) return repoIdCache.get(namespace)!
  try {
    // 调用 GET /repos/:namespace 获取单个知识库信息
    const info = await yqFetch<YuqueRepo>(`/repos/${encodeURIComponent(namespace)}`)
    if (info?.id) {
      repoIdCache.set(namespace, info.id)
      return info.id
    }
  } catch (err) {
    console.warn('[yuque] getRepoIdByNamespace error:', namespace, (err as any)?.message || err)
  }
  // 回退：通过用户/组织公开知识库列表匹配 namespace
  try {
    const [login] = namespace.split('/')
    if (login) {
      const repos = await listUserPublicRepos(login)
      const hit = repos.find((r) => r.namespace === namespace)
      if (hit?.id) {
        repoIdCache.set(namespace, hit.id)
        return hit.id
      }
    }
  } catch (err) {
    console.warn(
      '[yuque] getRepoIdByNamespace fallback list error:',
      namespace,
      (err as any)?.message || err,
    )
  }
  return undefined
}

export async function listUserPublicRepos(login: string): Promise<YuqueRepo[]> {
  if (!login) return []
  try {
    // 语雀 API: GET /users/:login/repos?type=Book 和 GET /groups/:login/repos?type=Book
    const [uResp, gResp] = await Promise.allSettled([
      yqFetch<any>(`/users/${encodeURIComponent(login)}/repos?type=Book`),
      yqFetch<any>(`/groups/${encodeURIComponent(login)}/repos?type=Book`),
    ])
    const toArr = (x: any) => (Array.isArray(x) ? x : Array.isArray(x?.data) ? x.data : [])
    const u = uResp.status === 'fulfilled' ? toArr(uResp.value) : []
    const g = gResp.status === 'fulfilled' ? toArr(gResp.value) : []
    // 合并并去重（按 namespace），仅保留公开知识库（public==1）
    const merged: Record<string, YuqueRepo> = {}
    for (const r of [...u, ...g]) {
      if (r && typeof r === 'object') {
        const ns = (r as any).namespace
        const isBook = (r as any).type ? String((r as any).type).toLowerCase() === 'book' : true
        const isPublic = (r as any).public === 1 || (r as any).public === true
        if (ns && isBook && isPublic) merged[ns] = r as YuqueRepo
      }
    }
    return Object.values(merged)
  } catch (err) {
    console.warn('[yuque] listUserPublicRepos error:', (err as any)?.message || err)
    return []
  }
}

export async function listRepoDocs(namespace: string, repoId?: number): Promise<YuqueDoc[]> {
  let source: 'namespace' | 'repoId' = 'namespace'
  try {
    // 调用 GET /repos/:namespace/docs 获取文档列表
    const resp = await yqFetch<any>(`/repos/${encodeURIComponent(namespace)}/docs?include_hits=1`)
    let docs = Array.isArray(resp) ? resp : Array.isArray(resp?.data) ? resp.data : []
    if (!Array.isArray(docs) || docs.length === 0) {
      // 回退：尝试使用 repo id 列表
      const id = repoId ?? (await getRepoIdByNamespace(namespace))
      if (id) {
        const respById = await yqFetch<any>(`/repos/${id}/docs?include_hits=1`)
        docs = Array.isArray(respById)
          ? respById
          : Array.isArray(respById?.data)
            ? respById.data
            : []
        source = 'repoId'
      }
    }
    const list = (Array.isArray(docs) ? docs : []) as YuqueDoc[]
    if (SHOULD_LOG) {
      console.info(
        '[yuque] listRepoDocs namespace=%s count=%d source=%s',
        namespace,
        list.length,
        source,
      )
    }
    return list
  } catch (err) {
    console.warn('[yuque] listRepoDocs error:', namespace, (err as any)?.message || err)
    return []
  }
}

// 允许控制 includeDrafts 的底层方法（用于健康检查与调试）。
export async function listRepoDocsRaw(
  namespace: string,
  opts?: { includeDrafts?: boolean; repoId?: number },
) {
  const q = new URLSearchParams({ include_hits: '1' })
  if (opts?.includeDrafts) q.set('include_drafts', '1')
  let source: 'namespace' | 'repoId' = 'namespace'
  try {
    const resp = await yqFetch<any>(`/repos/${encodeURIComponent(namespace)}/docs?${q.toString()}`)
    let docs = Array.isArray(resp) ? resp : Array.isArray(resp?.data) ? resp.data : []
    if (!Array.isArray(docs) || docs.length === 0) {
      const id = opts?.repoId ?? (await getRepoIdByNamespace(namespace))
      if (id) {
        const respById = await yqFetch<any>(`/repos/${id}/docs?${q.toString()}`)
        docs = Array.isArray(respById)
          ? respById
          : Array.isArray(respById?.data)
            ? respById.data
            : []
        source = 'repoId'
      }
    }
    const list = (Array.isArray(docs) ? docs : []) as YuqueDoc[]
    if (SHOULD_LOG) {
      console.info(
        '[yuque] listRepoDocsRaw namespace=%s drafts=%s count=%d source=%s',
        namespace,
        opts?.includeDrafts ? 'on' : 'off',
        list.length,
        source,
      )
    }
    return list
  } catch (err) {
    console.warn('[yuque] listRepoDocsRaw error:', namespace, (err as any)?.message || err)
    return []
  }
}

export async function getDocDetail(
  namespace: string,
  slug: string,
  opts?: { useCache?: boolean; ttlMs?: number },
): Promise<YuqueDocDetail | null> {
  const useCache = opts?.useCache !== false
  const ttl = Math.max(0, opts?.ttlMs ?? DEFAULT_DETAIL_TTL)
  const key = `${namespace}|${slug}`

  if (useCache) {
    const cached = detailCache.get(key)
    if (cached) return cached
  }

  const exec = async (): Promise<YuqueDocDetail | null> => {
  // 1) 直接按 slug 走 namespace
  try {
    const byNs = await yqFetch<YuqueDocDetail>(
      `/repos/${encodeURIComponent(namespace)}/docs/${encodeURIComponent(slug)}`,
    )
    if (byNs) {
      if (SHOULD_LOG) {
        console.info('[yuque] getDocDetail namespace hit namespace=%s slug=%s', namespace, slug)
      }
      return byNs
    }
  } catch {}
  // 2) 回退：按 slug 走 repo id
  let repoId: number | undefined
  try {
    repoId = await getRepoIdByNamespace(namespace)
    if (repoId) {
      const byId = await yqFetch<YuqueDocDetail>(
        `/repos/${repoId}/docs/${encodeURIComponent(slug)}`,
      )
      if (byId) {
        if (SHOULD_LOG) {
          console.info('[yuque] getDocDetail repoId hit namespace=%s slug=%s', namespace, slug)
        }
        return byId
      }
    }
  } catch {}
  // 3) 最后回退：通过列表将 slug 映射为数值 doc.id 再取详情
  try {
    const docs = await listRepoDocsRaw(namespace, { includeDrafts: true, repoId })
    const hit = (Array.isArray(docs) ? docs : []).find((d) => String(d.slug) === String(slug))
    if (hit?.id && (repoId || (repoId = await getRepoIdByNamespace(namespace)))) {
      const detail = await yqFetch<YuqueDocDetail>(`/repos/${repoId}/docs/${hit.id}`)
      if (detail) {
        if (SHOULD_LOG) {
          console.info('[yuque] getDocDetail docId fallback namespace=%s slug=%s', namespace, slug)
        }
        return detail
      }
    }
  } catch {}
  return null
  }

  if (!useCache) return exec()

  const p = exec()
  // 先写入，进行并发去重；待完成后根据结果调整 TTL（成功/失败）
  detailCache.set(key, p, ttl)
  p.then((res) => {
    if (res === null) {
      // 失败短路：短 TTL 缓存 null，避免频繁重试
      detailCache.set(key, Promise.resolve(null), DEFAULT_FAIL_TTL)
    } else {
      // 成功：覆盖为 resolved promise，正常 TTL
      detailCache.set(key, Promise.resolve(res), ttl)
    }
  }).catch(() => {
    // 异常也短路
    detailCache.set(key, Promise.resolve(null), DEFAULT_FAIL_TTL)
  })
  return p
}

export type PublicDocItem = {
  namespace: string
  repo: string
  login: string
  doc: YuqueDoc
}

// —— 目录（TOC）支持 ——
export type YuqueTocRaw = {
  uuid?: string
  parent_uuid?: string | null
  title?: string
  type?: string // 'DOC' | 'TITLE' | ...
  slug?: string // 对于文档条目
  url?: string
  depth?: number
} & Record<string, any>

export type YuqueTocNode = YuqueTocRaw & { children?: YuqueTocNode[] }

export async function listRepoToc(
  namespace: string,
  opts?: { repoId?: number },
): Promise<YuqueTocRaw[]> {
  const cleanup = (arr: any[]): YuqueTocRaw[] => {
    const out = (Array.isArray(arr) ? arr : []).filter((it) => {
      const t = String(it?.type || '').toUpperCase()
      // 过滤掉 META 或者既没有标题也没有 slug/url 的占位项
      if (t === 'META') return false
      const hasTitle = typeof it?.title === 'string' && it.title.trim().length > 0
      const hasLink = !!(it?.slug || it?.url)
      return hasTitle || hasLink
    })
    return out as YuqueTocRaw[]
  }
  try {
    // 优先使用 id 形态
    if (opts?.repoId) {
      const data = await yqFetch<any>(`/repos/${opts.repoId}/toc`)
      let arr = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
          ? (data as any).data
          : Array.isArray(data?.toc)
            ? data.toc
            : []
      // 一些返回为 book_detail，目录在 toc_yml（YAML 字符串）里（注意可能在 data.toc_yml）
      const tocYml = (data as any)?.toc_yml || (data as any)?.data?.toc_yml
      if ((!arr || arr.length === 0) && typeof tocYml === 'string') {
        try {
          const mod: any = await import('yaml')
          const parse = mod.parse || mod.default?.parse
          const parsed = parse ? parse(tocYml) : undefined
          if (Array.isArray(parsed)) arr = parsed
        } catch (e) {
          console.warn('[yuque] parse toc_yml failed (id):', (e as any)?.message || e)
        }
      }
      return cleanup(arr)
    }
  } catch (err) {
    console.warn('[yuque] listRepoToc by id error:', namespace, (err as any)?.message || err)
  }
  // 回退：尝试 namespace 形态
  try {
    const data = await yqFetch<any>(`/repos/${encodeURIComponent(namespace)}/toc`)
    let arr = Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.data)
        ? (data as any).data
        : Array.isArray(data?.toc)
          ? data.toc
          : []
    const tocYml = (data as any)?.toc_yml || (data as any)?.data?.toc_yml
    if ((!arr || arr.length === 0) && typeof tocYml === 'string') {
      try {
        const mod: any = await import('yaml')
        const parse = mod.parse || mod.default?.parse
        const parsed = parse ? parse(tocYml) : undefined
        if (Array.isArray(parsed)) arr = parsed
      } catch (e) {
        console.warn('[yuque] parse toc_yml failed (ns):', (e as any)?.message || e)
      }
    }
    return cleanup(arr)
  } catch (err) {
    console.warn('[yuque] listRepoToc by namespace error:', namespace, (err as any)?.message || err)
    return []
  }
}

export function buildTocTree(items: YuqueTocRaw[]): YuqueTocNode[] {
  if (!Array.isArray(items)) return []

  // 一些语雀 TOC 条目（尤其是某些文档/链接）可能没有 uuid。
  // 旧实现直接丢弃这类条目，导致目录缺失。这里为缺失 uuid 的条目生成稳定的兜底 id。
  const genId = (it: YuqueTocRaw, idx: number) => {
    // 优先使用官方 uuid
    if (it.uuid) return String(it.uuid)
    // 其次用 slug / url 的最后一段
    if (it.slug) return `slug:${it.slug}`
    if (it.url) {
      const last = String(it.url).split('/').filter(Boolean).slice(-1)[0]
      if (last) return `url:${last}`
    }
    // 再退化到标题
    if (it.title) return `title:${it.title}:${idx}`
    // 最后使用索引，确保唯一
    return `idx:${idx}`
  }

  const map = new Map<string, YuqueTocNode>()
  const roots: YuqueTocNode[] = []

  // 先创建节点并放入 map（为缺失 uuid 的条目注入兜底 uuid，便于前端持久化展开状态）
  items.forEach((it, idx) => {
    const id = genId(it, idx)
    const node: YuqueTocNode = { ...it, uuid: it.uuid ?? id, children: [] }
    map.set(id, node)
  })

  // 第二轮：根据 parent_uuid 进行挂载。parent_uuid 只会引用语雀的真实 uuid；
  // 如果找不到 parent，则作为根节点挂载。
  items.forEach((it, idx) => {
    const id = genId(it, idx)
    const node = map.get(id)
    if (!node) return
    const parentKey = it.parent_uuid ? String(it.parent_uuid) : ''
    if (parentKey && map.has(parentKey)) {
      map.get(parentKey)!.children!.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

export async function listAllPublicDocs(
  login: string,
  opts?: { includeDrafts?: boolean },
): Promise<PublicDocItem[]> {
  const repos = await listUserPublicRepos(login)
  // 顺序抓取以控制 API 压力
  const out: PublicDocItem[] = []
  for (const r of Array.isArray(repos) ? repos : []) {
    try {
      const docs = opts?.includeDrafts
        ? await listRepoDocsRaw(r.namespace, { includeDrafts: true, repoId: r.id })
        : await listRepoDocs(r.namespace, r.id)
      for (const d of Array.isArray(docs) ? docs : []) {
        const [lg, repo] = r.namespace.split('/')
        out.push({ namespace: r.namespace, repo, login: lg, doc: d })
      }
      if (SHOULD_LOG) {
        console.info(
          '[yuque] listAllPublicDocs namespace=%s fetched=%d includeDrafts=%s',
          r.namespace,
          Array.isArray(docs) ? docs.length : 0,
          opts?.includeDrafts ? 'on' : 'off',
        )
      }
    } catch (err) {
      console.warn(
        '[yuque] listAllPublicDocs repo loop error:',
        r.namespace,
        (err as any)?.message || err,
      )
    }
  }
  if (SHOULD_LOG) {
    console.info('[yuque] listAllPublicDocs login=%s totalDocs=%d', login, out.length)
  }
  // 按更新时间倒序
  return out.sort((a, b) => +new Date(b.doc.updated_at) - +new Date(a.doc.updated_at))
}

// 调试探针：快速验证 token 是否注入、能否拿到公开知识库
export async function debugProbe(login: string): Promise<{
  ok: boolean
  reposCount?: number
  sampleNamespaces?: string[]
  error?: string
}> {
  if (!login) return { ok: false, error: 'NO_LOGIN' }
  try {
    const resp = await listUserPublicRepos(login)
    const repos = Array.isArray(resp) ? resp : []
    return {
      ok: true,
      reposCount: repos.length,
      sampleNamespaces: repos.slice(0, 5).map((r) => r.namespace),
    }
  } catch (err) {
    return { ok: false, error: (err as any)?.message || String(err) }
  }
}

// —— 搜索 ——
export type YuqueSearchItem = {
  id: number
  type: string // 类型字段，语雀文章通常为 'Doc'
  title: string
  summary?: string
  target_type?: string
  url?: string
  book?: { namespace?: string }
  doc?: { slug?: string }
  updated_at?: string
}

export async function searchYuqueAll(login: string, q: string, opts?: { limit?: number }) {
  if (!login || !q) return [] as YuqueSearchItem[]
  try {
    // 语雀 API：GET /search?q=xxx&type=doc&scope=user login
    const params = new URLSearchParams({ q, type: 'doc', scope: 'user', user: login })
    const resp = await yqFetch<any>(`/search?${params.toString()}`)
    const arr = Array.isArray(resp) ? resp : Array.isArray(resp?.data) ? resp.data : []
    const items = (arr as any[]).filter(Boolean) as YuqueSearchItem[]
    return typeof opts?.limit === 'number' ? items.slice(0, opts.limit) : items
  } catch (err) {
    console.warn('[yuque] search error:', (err as any)?.message || err)
    return []
  }
}

export type MindMapDiagram = {
  body: Array<{
    id: string
    html?: string
    children?: MindMapDiagram['body']
  }>
}

export async function listRepoMindMap(
  namespace: string,
  slug: string,
): Promise<MindMapDiagram | null> {
  try {
    const detail = await getDocDetail(namespace, slug)
    if (!detail) return null
    if ((detail as any)?.format !== 'lakemind' && (detail as any)?.type !== 'Mind') return null
    const raw = detail.body || (detail as any)?.body_draft
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.diagramData ?? null
  } catch (err) {
    console.warn('[yuque] listRepoMindMap error:', namespace, slug, (err as any)?.message || err)
    return null
  }
}

// —— 视图（浏览量）工具 ——
/**
 * 统一获取某篇文档的“浏览量”：优先 read_count，其次 hits。
 * - 可传入 hint 以避免二次请求；否则内部会通过 getDocDetail（带缓存）补齐。
 */
export async function getViews(
  namespace: string,
  slug: string,
  opts?: { hint?: { read_count?: number; hits?: number }; ttlMs?: number },
): Promise<number | undefined> {
  const hint = opts?.hint
  if (typeof hint?.read_count === 'number') return hint.read_count
  // 若只提供了 hits，但我们偏好 read_count，则尝试取详情（带缓存）
  const detail = await getDocDetail(namespace, slug, { useCache: true, ttlMs: opts?.ttlMs })
  const views = (detail as any)?.read_count ?? (detail as any)?.hits ?? hint?.hits
  return typeof views === 'number' ? views : undefined
}

/**
 * 为一批 slug 补齐浏览量（常用于列表页）。
 * 仅对缺少 read_count 的条目请求详情，其它复用 hint。
 */
export async function ensureViews(
  namespace: string,
  slugs: string[],
  hints?: Record<string, { read_count?: number; hits?: number }>,
  opts?: { ttlMs?: number },
): Promise<Record<string, number | undefined>> {
  const out: Record<string, number | undefined> = {}
  const need: string[] = []
  for (const s of slugs) {
    const h = hints?.[s]
    if (typeof h?.read_count === 'number') {
      out[s] = h.read_count
    } else if (typeof h?.hits === 'number') {
      // 先把 hits 写入，后续再尝试通过详情提升为 read_count
      out[s] = h.hits
      need.push(s)
    } else {
      need.push(s)
    }
  }
  if (need.length === 0) return out
  const results = await Promise.allSettled(
    need.map((s) => getDocDetail(namespace, s, { useCache: true, ttlMs: opts?.ttlMs })),
  )
  results.forEach((r, i) => {
    const s = need[i]
    if (r.status === 'fulfilled' && r.value) {
      const v = (r.value as any)?.read_count ?? (r.value as any)?.hits
      if (typeof v === 'number') out[s] = v
    }
  })
  return out
}

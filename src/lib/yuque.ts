import 'server-only'

type YuqueRepo = {
  id: number
  name: string
  slug: string
  namespace: string // login/slug
  description?: string
  updated_at: string
  type?: string // expect 'Book' for knowledge base
  public?: number // 1 for public
}

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

type YuqueDocDetail = YuqueDoc & {
  body?: string // markdown
  body_html?: string
  format?: 'markdown' | 'lake' | string
}

const BASE = process.env.YUQUE_BASE || 'https://www.yuque.com/api/v2'
const TOKEN = process.env.YUQUE_TOKEN || ''
// 统一控制对语雀 API 的 ISR 缓存时间（秒），默认 10 分钟，可通过环境变量覆盖
const FETCH_REVALIDATE = Math.max(
  0,
  Number(process.env.YUQUE_FETCH_REVALIDATE || 60 * 10) || 60 * 10,
)
const SHOULD_LOG = process.env.NODE_ENV !== 'test'

if (!TOKEN) {
  // 在构建或开发时给出一次提示，但不抛错，允许无 Token 环境继续构建
  console.warn('[yuque] YUQUE_TOKEN 未配置，无法调用语雀开放 API。')
}

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

// 缓存：namespace -> repo id（减少重复查询）
const repoIdCache = new Map<string, number>()

// 简单的详情缓存：key=namespace|slug，值为 Promise，防止重复并发请求；附带 TTL
type CacheEntry<T> = { p: Promise<T>; expireAt: number }
const detailCache = new Map<string, CacheEntry<YuqueDocDetail | null>>()
const DEFAULT_DETAIL_TTL = 5 * 60 * 1000 // 5 分钟

async function getRepoIdByNamespace(namespace: string): Promise<number | undefined> {
  if (!namespace) return undefined
  if (repoIdCache.has(namespace)) return repoIdCache.get(namespace)!
  try {
    // GET /repos/:namespace 返回单个知识库信息
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
    // GET /repos/:namespace/docs
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
    const hit = detailCache.get(key)
    if (hit && Date.now() < hit.expireAt) return hit.p
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
  detailCache.set(key, { p, expireAt: Date.now() + ttl })
  // 失败时清理缓存，避免长时间缓存 null 错误
  p.catch(() => detailCache.delete(key))
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
  type: string // expect 'Doc'
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

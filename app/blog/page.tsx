/**
 * 博客索引页（/blog）
 * - 聚合语雀账号下所有公开文档，按知识库分组并支持默认展开配置
 * - 结合目录树与文档元信息渲染列表，移除浏览量等多余统计
 */
import { listAllPublicDocs, listUserPublicRepos, listRepoToc, buildTocTree, listUserGroups } from '@/lib/yuque'
import BlogGroupsPersist from '@/components/site/blog-groups-persist'
import Link from 'next/link'
import { formatDateTime } from '@/lib/datetime'

export const revalidate = 60 * 10

export default async function BlogIndex() {
  const login = process.env.YUQUE_LOGIN || ''
  const includeDrafts = process.env.YUQUE_INCLUDE_DRAFTS === 'true'
  const [items, repos, groups] = login
    ? [
        await listAllPublicDocs(login, { includeDrafts }),
        await listUserPublicRepos(login),
        await listUserGroups(login),
      ]
    : [[], [], []]

  // 1) 仍然先按知识库（namespace）分组，得到每个知识库的文档与最近更新时间
  const repoMap = new Map<string, any>()
  for (const r of repos as any[]) repoMap.set(r.namespace, r)

  const groupsByNs = new Map<string, { namespace: string; repo?: any; docs: typeof items; latest: string }>()
  for (const it of items) {
    const ns = it.namespace
    if (!groupsByNs.has(ns))
      groupsByNs.set(ns, { namespace: ns, repo: repoMap.get(ns), docs: [] as any, latest: '1970-01-01' })
    const g = groupsByNs.get(ns)!
    g.docs.push(it)
    // 维护最新更新时间
    const u = it.doc.updated_at
    if (!g.latest || +new Date(u) > +new Date(g.latest)) g.latest = u
  }
  let groupedNs = Array.from(groupsByNs.values()).map((g) => ({
    ...g,
    // 每个知识库内部的文档按更新时间倒序
    docs: g.docs.sort((a, b) => +new Date(b.doc.updated_at) - +new Date(a.doc.updated_at)),
  }))

  // 2) 新：将 namespace 分组再按 login 进行二级分块
  type NsGroup = typeof groupedNs[number]
  type LoginBlock = { login: string; groups: NsGroup[]; latest: string }
  const byLogin = new Map<string, LoginBlock>()
  for (const g of groupedNs) {
    const lg = g.namespace.split('/')[0]
    if (!byLogin.has(lg)) byLogin.set(lg, { login: lg, groups: [], latest: '1970-01-01' })
    const blk = byLogin.get(lg)!
    blk.groups.push(g)
    // 统计该 login 下最新更新时间
    if (!blk.latest || +new Date(g.latest) > +new Date(blk.latest)) blk.latest = g.latest
  }

  // 3) 排序：先个人（等于 env.YUQUE_LOGIN），其余按最新更新时间倒序
  const blocks = Array.from(byLogin.values()).sort((a, b) => +new Date(b.latest) - +new Date(a.latest))
  const selfIdx = blocks.findIndex((b) => b.login === login)
  if (selfIdx > 0) {
    const [self] = blocks.splice(selfIdx, 1)
    blocks.unshift(self)
  }
  // login -> 小组信息 映射（个人块显示固定“我的知识库”）
  const groupInfoMap = new Map<string, { name?: string; desc?: string; url?: string }>(
    groups.map((g: any) => [g.login, { name: g.name, desc: g.description, url: g.url }]),
  )

  const defaultOpenNamespace = login ? `${login}/blog` : undefined
  const whitelist = (process.env.BLOG_DEFAULT_OPEN_WHITELIST || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const defaultOpenSet = new Set<string>([
    ...(defaultOpenNamespace ? [defaultOpenNamespace] : []),
    ...whitelist,
  ])
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">博客</h1>
      {!login && (
        <p className="text-sm text-muted-foreground">未配置 YUQUE_LOGIN，无法列出公开文档。</p>
      )}
      {login && items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          未发现公开文档。请检查：语雀知识库与文档是否公开、YUQUE_TOKEN 是否有效、或稍后再试。
        </p>
      )}
      {/* 新增：块级导航（我的 + 各小组） */}
      {blocks.length > 0 && (
        <nav className="mb-4 flex flex-wrap gap-2 text-sm sticky top-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 py-2">
          {blocks.map((b) => {
            const isSelf = b.login === login
            const info = groupInfoMap.get(b.login)
            const text = isSelf ? '我的' : info?.name || b.login
            const id = `blk-${b.login.replace(/[^a-zA-Z0-9_-]+/g, '-')}`
            return (
              <a key={b.login} href={`#${id}`} className="rounded border px-2 py-1 hover:bg-accent">
                {text}
              </a>
            )
          })}
        </nav>
      )}
      {/* 客户端持久化展开状态（localStorage） */}
      {process.env.BLOG_REMEMBER_OPEN !== 'false' && (
        <BlogGroupsPersist storageKey="blog-open-groups-v1" />
      )}
      {/* 顶层：先显示“自己名下”的块，然后每个小组一个块 */}
      {await Promise.all(
        blocks.map(async (blk, bi) => {
          const isSelf = blk.login === login
          const info = groupInfoMap.get(blk.login)
          const displayName = info?.name || blk.login
          const title = isSelf ? '我的知识库' : `知识小组：${displayName}（${blk.login}）`
          return (
            <section key={`blk-${blk.login}-${bi}`} id={`blk-${blk.login}`} className="mb-6">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">{title}</h2>
                {!isSelf && (info?.desc || info?.url) && (
                  <div className="text-xs text-muted-foreground max-w-[60%] text-right">
                    {info?.desc && <p className="line-clamp-2">{info.desc}</p>}
                    {info?.url && (
                      <a
                        href={info.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline inline-block mt-1"
                        aria-label={`访问小组 ${displayName}`}
                      >
                        访问小组 →
                      </a>
                    )}
                  </div>
                )}
              </div>
              {/* 新增：块内知识库导航 */}
              {blk.groups.length > 1 && (
                <nav className="mb-2 flex flex-wrap gap-2 text-xs">
                  {blk.groups.map((g) => {
                    const id = `ns-${g.namespace.replace(/[^a-zA-Z0-9_-]+/g, '-')}`
                    return (
                      <a
                        key={g.namespace}
                        href={`#${id}`}
                        className="rounded border px-1.5 py-0.5 hover:bg-accent"
                      >
                        {g.repo?.name || g.namespace.split('/')[1]}
                      </a>
                    )
                  })}
                </nav>
              )}
              <div className="columns-1 sm:columns-2 gap-4">
                {await Promise.all(
                  blk.groups
                    .sort((a, b) => +new Date(b.latest) - +new Date(a.latest))
                    .map(async (g) => {
                      const id = `ns-${g.namespace.replace(/[^a-zA-Z0-9_-]+/g, '-')}`
                      const open = defaultOpenSet.has(g.namespace)
                      const tocRaw = await listRepoToc(g.namespace, { repoId: g.repo?.id })
                      const tocTree = buildTocTree(tocRaw)
                      return (
                        <section key={g.namespace} id={id} className="rounded-md border p-2 mb-4 break-inside-avoid">
                          <details className="group" data-ns={g.namespace} {...(open ? { open: true } : {})}>
                            <summary className="cursor-pointer list-none px-2 py-1 flex items-center gap-3 relative after:content-[''] after:absolute after:right-2 after:h-0 after:w-0 after:border-x-8 after:border-x-transparent after:border-t-8 after:border-t-current after:opacity-60 group-open:after:rotate-180 after:transition-transform after:duration-300">
                              <div className="flex items-center gap-2 min-w-0 truncate">
                                <span className="text-xs text-muted-foreground shrink-0">{g.namespace}</span>
                                <h3 className="text-base font-medium truncate">
                                  {g.repo?.name || g.namespace.split('/')[1]}{' '}
                                  <span className="text-sm text-muted-foreground">({g.docs.length})</span>
                                </h3>
                              </div>
                            </summary>
                            <div className="grid transition-[grid-template-rows] duration-300 ease-in-out grid-rows-[0fr] group-open:grid-rows-[1fr]">
                              <div className="p-2 overflow-hidden">
                                {tocTree.length > 0 ? (
                                  <TocList
                                    namespace={g.namespace}
                                    nodes={tocTree}
                                    stats={new Map(g.docs.map((it) => [it.doc.slug, it]))}
                                  />
                                ) : (
                                  <ul className="space-y-2">
                                    {g.docs.map((it) => (
                                      <li key={`${it.namespace}/${it.doc.slug}`} className="rounded border p-3">
                                        <Link className="text-base underline" href={`/blog/${it.namespace}/${it.doc.slug}` as any}>
                                          {it.doc.title}
                                        </Link>
                                        <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                                          <span>发布 {formatDateTime(it.doc.created_at)}</span>
                                          {typeof it.doc.word_count === 'number' && <span>{it.doc.word_count} 字</span>}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </details>
                        </section>
                      )
                    }),
                )}
              </div>
            </section>
          )
        }),
      )}
    </div>
  )
}

function TocList({
  namespace,
  nodes,
  stats,
}: {
  namespace: string
  nodes: ReturnType<typeof buildTocTree>
  stats: Map<string, any>
}) {
  return (
  <ul className="space-y-1">
      {nodes.map((n) => (
        <li key={n.uuid || n.title}>
          {(() => {
            const hasChildren = !!(n.children && n.children.length)
            const slugFromUrl = (n.url || '').split('/').filter(Boolean).slice(-1)[0]
            const finalSlug = (n.slug || slugFromUrl || '').trim()
            const isDocLike = ['DOC', 'Mind'].includes(String(n.type || '')) || !!finalSlug
            // 有子节点时优先当“分组”展开
            if (hasChildren) {
              return (
                <details className="mt-2" open>
                  <summary className="font-medium text-sm cursor-pointer select-none">
                    {n.title}
                  </summary>
                  <div className="ml-4 border-l pl-3 mt-2">
                    <TocList namespace={namespace} nodes={n.children!} stats={stats} />
                  </div>
                </details>
              )
            }
            // 仅在没有子节点时才当文档渲染
            if (isDocLike && finalSlug) {
              const info = n.slug ? (stats.get(n.slug) as any) : undefined
              const doc = info?.doc ?? {}
              return (
                <div className="rounded border px-3 py-1 flex items-center gap-3 hover:bg-accent/30 transition-colors">
                  <Link
                    className="truncate underline grow"
                    href={`/blog/${namespace}/${finalSlug}` as any}
                    title={n.title}
                  >
                    {n.title}
                  </Link>
                  {(doc.created_at || typeof doc.word_count === 'number') && (
                    <div className="shrink-0 text-xs text-muted-foreground flex items-center gap-2">
                      {doc.created_at && <span>发布 {formatDateTime(doc.created_at)}</span>}
                      {typeof doc.word_count === 'number' && <span>{doc.word_count} 字</span>}
                      {doc.type === 'Mind' && <span>思维导图</span>}
                    </div>
                  )}
                </div>
              )
            }
            // 兜底：无 slug/url 且无 children 的占位，直接跳过
            return null
          })()}
        </li>
      ))}
    </ul>
  )
}

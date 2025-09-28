import {
  listAllPublicDocs,
  listUserPublicRepos,
  listRepoToc,
  buildTocTree,
  ensureViews,
} from '@/lib/yuque'
import BlogGroupsPersist from '@/components/site/blog-groups-persist'
import Link from 'next/link'
import { formatDateTime } from '@/lib/datetime'

export const revalidate = 60 * 10

export default async function BlogIndex() {
  const login = process.env.YUQUE_LOGIN || ''
  const includeDrafts = process.env.YUQUE_INCLUDE_DRAFTS === 'true'
  const [items, repos] = login
    ? [await listAllPublicDocs(login, { includeDrafts }), await listUserPublicRepos(login)]
    : [[], []]

  // 按知识库（namespace）分组
  const repoMap = new Map<string, any>()
  for (const r of repos as any[]) repoMap.set(r.namespace, r)

  const groups = new Map<string, { namespace: string; repo?: any; docs: typeof items }>()
  for (const it of items) {
    const ns = it.namespace
    if (!groups.has(ns)) groups.set(ns, { namespace: ns, repo: repoMap.get(ns), docs: [] as any })
    groups.get(ns)!.docs.push(it)
  }

  // 将分组转为数组，并按“该知识库最近更新的文档时间”倒序
  let grouped = Array.from(groups.values())
    .map((g) => ({
      ...g,
      docs: g.docs.sort((a, b) => +new Date(b.doc.updated_at) - +new Date(a.doc.updated_at)),
      latest: g.docs.length ? g.docs[0].doc.updated_at : '1970-01-01',
    }))
    .sort((a, b) => +new Date(b.latest) - +new Date(a.latest))

  // 将指定组（login/blog）置顶
  const pinNs = login ? `${login}/blog` : ''
  if (pinNs) {
    const idx = grouped.findIndex((g) => g.namespace === pinNs)
    if (idx > 0) {
      const [pinned] = grouped.splice(idx, 1)
      grouped = [pinned, ...grouped]
    }
  }

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
      {grouped.length > 1 && (
        <nav className="mb-4 flex flex-wrap gap-2 text-sm">
          {grouped.map((g) => {
            const id = `ns-${g.namespace.replace(/[^a-zA-Z0-9_-]+/g, '-')}`
            return (
              <a
                key={g.namespace}
                href={`#${id}`}
                className="rounded border px-2 py-1 hover:bg-accent"
              >
                {g.repo?.name || g.namespace.split('/')[1]} ({g.docs.length})
              </a>
            )
          })}
        </nav>
      )}
      {/* 客户端持久化展开状态（localStorage） */}
      {process.env.BLOG_REMEMBER_OPEN !== 'false' && (
        <BlogGroupsPersist storageKey="blog-open-groups-v1" />
      )}
      <div className="space-y-6">
        {await Promise.all(
          grouped.map(async (g) => {
            const id = `ns-${g.namespace.replace(/[^a-zA-Z0-9_-]+/g, '-')}`
            const open = defaultOpenSet.has(g.namespace)
            // 获取该知识库目录结构
            const tocRaw = await listRepoToc(g.namespace, { repoId: g.repo?.id })
            const tocTree = buildTocTree(tocRaw)
            // 统一浏览量：预先为该知识库的叶子 slug 做回填
            const collectLeafSlugs = (nodes: ReturnType<typeof buildTocTree>): string[] => {
              const out = new Set<string>()
              const walk = (arr: any[]) => {
                for (const n of arr || []) {
                  const hasChildren = !!(n.children && n.children.length)
                  const slugFromUrl = (n.url || '').split('/').filter(Boolean).slice(-1)[0]
                  const finalSlug = (n.slug || slugFromUrl || '').trim()
                  const isDocLike = ['DOC', 'Mind'].includes(String(n.type || '')) || !!finalSlug
                  if (!hasChildren && isDocLike && finalSlug) out.add(finalSlug)
                  if (hasChildren) walk(n.children)
                }
              }
              walk(nodes)
              return Array.from(out)
            }
            const leafSlugs = collectLeafSlugs(tocTree)
            const hintMap = Object.fromEntries(
              g.docs.map((it: any) => [it.doc.slug, { read_count: it.doc.read_count, hits: it.doc.hits }]),
            )
            const viewsMap = leafSlugs.length
              ? await ensureViews(g.namespace, leafSlugs, hintMap)
              : {}

            return (
              <section key={g.namespace} id={id} className="rounded-md border p-2">
                <details className="group" data-ns={g.namespace} {...(open ? { open: true } : {})}>
                  <summary className="cursor-pointer list-none px-2 py-2 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">{g.namespace}</div>
                      <h2 className="text-lg font-medium">
                        {g.repo?.name || g.namespace.split('/')[1]}{' '}
                        <span className="text-sm text-muted-foreground">({g.docs.length})</span>
                      </h2>
                      {g.repo?.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {g.repo.description}
                        </p>
                      )}
                    </div>
                    <span className="text-muted-foreground text-sm">&nbsp;</span>
                  </summary>
                  <div className="p-2">
                    {tocTree.length > 0 ? (
                      <TocList
                        namespace={g.namespace}
                        nodes={tocTree}
                        stats={new Map(g.docs.map((it) => [it.doc.slug, it]))}
                        viewMap={viewsMap}
                      />
                    ) : (
                      <ul className="space-y-2">
                        {g.docs.map((it) => (
                          <li key={`${it.namespace}/${it.doc.slug}`} className="rounded border p-3">
                            <Link
                              className="text-base underline"
                              href={`/blog/${it.namespace}/${it.doc.slug}` as any}
                            >
                              {it.doc.title}
                            </Link>
                            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                              <span>发布 {formatDateTime(it.doc.created_at)}</span>
                              {it.doc.updated_at && it.doc.updated_at !== it.doc.created_at && (
                                <span className="text-muted-foreground/70">
                                  更新 {formatDateTime(it.doc.updated_at)}
                                </span>
                              )}
                              {typeof it.doc.word_count === 'number' && (
                                <span>{it.doc.word_count} 字</span>
                              )}
                              {(() => {
                                const v = viewsMap?.[it.doc.slug]
                                const views = typeof it.doc.read_count === 'number' ? it.doc.read_count : v ?? it.doc.hits
                                return typeof views === 'number' ? <span>{views} 次浏览</span> : null
                              })()}
                              {typeof it.doc.likes_count === 'number' && (
                                <span>{it.doc.likes_count} 喜欢</span>
                              )}
                              {typeof it.doc.comments_count === 'number' && (
                                <span>{it.doc.comments_count} 评论</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              </section>
            )
          }),
        )}
      </div>
    </div>
  )
}

function TocList({
  namespace,
  nodes,
  stats,
  viewMap,
}: {
  namespace: string
  nodes: ReturnType<typeof buildTocTree>
  stats: Map<string, any>
  viewMap?: Record<string, number | undefined>
}) {
  return (
    <ul className="space-y-2">
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
                    <TocList namespace={namespace} nodes={n.children!} stats={stats} viewMap={viewMap} />
                  </div>
                </details>
              )
            }
            // 仅在没有子节点时才当文档渲染
            if (isDocLike && finalSlug) {
              const info = n.slug ? (stats.get(n.slug) as any) : undefined
              const doc = info?.doc ?? {}
              const v = viewMap?.[finalSlug]
              const views = typeof doc.read_count === 'number' ? doc.read_count : v ?? doc.hits
              return (
                <div className="rounded border px-3 py-2 flex items-center justify-between hover:bg-accent/30 transition-colors">
                  <Link
                    className="max-w-[70%] truncate underline"
                    href={`/blog/${namespace}/${finalSlug}` as any}
                    title={n.title}
                  >
                    {n.title}
                  </Link>
                  {(doc.created_at ||
                    doc.updated_at ||
                    typeof doc.word_count === 'number' ||
                    typeof views === 'number' ||
                    typeof doc.likes_count === 'number' ||
                    typeof doc.comments_count === 'number') && (
                    <div className="shrink-0 text-xs text-muted-foreground flex flex-wrap gap-2 justify-end">
                      {doc.created_at && <span>发布 {formatDateTime(doc.created_at)}</span>}
                      {doc.updated_at && doc.updated_at !== doc.created_at && (
                        <span className="text-muted-foreground/70">
                          更新 {formatDateTime(doc.updated_at)}
                        </span>
                      )}
                      {typeof doc.word_count === 'number' && <span>{doc.word_count} 字</span>}
                      {typeof views === 'number' && <span>{views} 次浏览</span>}
                      {doc.type === 'Mind' && <span>思维导图</span>}
                      {typeof doc.likes_count === 'number' && <span>{doc.likes_count} 喜欢</span>}
                      {typeof doc.comments_count === 'number' && (
                        <span>{doc.comments_count} 评论</span>
                      )}
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

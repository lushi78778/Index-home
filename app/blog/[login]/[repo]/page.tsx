import {
  listRepoToc,
  listUserPublicRepos,
  buildTocTree,
  listRepoDocsRaw,
  getDocDetail,
} from '@/lib/yuque'
import Link from 'next/link'
import { formatDateTime } from '@/lib/datetime'

export const revalidate = 60 * 10

export default async function RepoIndexPage({
  params,
}: {
  params: { login: string; repo: string }
}) {
  const MAX_DEPTH = Math.max(1, Number(process.env.BLOG_TOC_MAX_DEPTH || '5') || 5)
  const namespace = `${params.login}/${params.repo}`

  // 获取 TOC（优先 namespace，失败回退 id）
  let toc = await listRepoToc(namespace)
  if (!toc?.length) {
    try {
      const repos = await listUserPublicRepos(params.login)
      const id = repos.find((r) => r.namespace === namespace)?.id
      if (id) toc = await listRepoToc(namespace, { repoId: id })
    } catch {}
  }
  const tree = buildTocTree(toc || [])

  // 列表 meta
  let docsMeta: Record<
    string,
    {
      word_count?: number
      updated_at?: string
      created_at?: string
      read_count?: number
      hits?: number
      likes_count?: number
      comments_count?: number
      type?: string
    }
  > = {}
  try {
    const docs = await listRepoDocsRaw(namespace, { includeDrafts: true })
    docsMeta = Object.fromEntries(
      (docs || []).map((d: any) => [
        String(d.slug),
        {
          word_count: d.word_count,
          updated_at: d.updated_at,
          created_at: d.created_at,
          read_count: d.read_count,
          hits: d.hits,
          likes_count: d.likes_count,
          comments_count: d.comments_count,
          type: d.type,
        },
      ]),
    )
  } catch {}

  // 工具方法
  type TocNode = ReturnType<typeof buildTocTree>[number]
  const isDocLike = (n: TocNode) => {
    const t = (n.type || '').toString().toUpperCase()
    return t === 'DOC' || t === 'MIND' || !!n.slug || !!n.url
  }
  const getSlug = (n: TocNode) =>
    n.slug || (n.url ? n.url.split('/').filter(Boolean).slice(-1)[0] : '')

  // 预取：为即将渲染的文档补齐 read_count（与详情一致，限 30 个）
  const collectSlugs = (
    arr: TocNode[] | undefined,
    depth = 1,
    out: Set<string> = new Set(),
  ): Set<string> => {
    for (const n of arr || []) {
      if (isDocLike(n)) {
        const s = getSlug(n)
        if (s) out.add(s)
      }
      if (depth < MAX_DEPTH && n.children && n.children.length) {
        collectSlugs(n.children, depth + 1, out)
      }
    }
    return out
  }
  const slugs = Array.from(collectSlugs(tree))
  const detailViewsMap: Record<string, number> = {}
  const needDetail: string[] = []
  for (const s of slugs) {
    const meta = docsMeta[s]
    if (!meta || typeof meta.read_count !== 'number') needDetail.push(s)
    if (needDetail.length >= 30) break
  }
  if (needDetail.length) {
    const results = await Promise.allSettled(needDetail.map((s) => getDocDetail(namespace, s)))
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value) {
        const s = needDetail[i]
        const v = (r.value as any)?.read_count ?? (r.value as any)?.hits
        if (typeof v === 'number') detailViewsMap[s] = v
        const curr = docsMeta[s] || {}
        docsMeta[s] = {
          ...curr,
          word_count: curr.word_count ?? (r.value as any)?.word_count,
          updated_at: curr.updated_at ?? (r.value as any)?.updated_at,
          created_at: curr.created_at ?? (r.value as any)?.created_at,
          read_count: curr.read_count ?? (r.value as any)?.read_count,
          hits: curr.hits ?? (r.value as any)?.hits,
          type: curr.type ?? (r.value as any)?.type,
        }
      }
    })
  }

  // 单行文档行
  const DocRow = ({ node }: { node: TocNode }) => {
    const slug = getSlug(node)
    if (!slug) return null
    const meta = docsMeta[slug] || {}
    const views =
      typeof meta.read_count === 'number'
        ? meta.read_count
        : typeof detailViewsMap[slug] === 'number'
          ? detailViewsMap[slug]
          : meta.hits
    return (
      <div className="rounded border px-3 py-2 flex items-center justify-between hover:bg-accent/30 transition-colors">
        <Link
          className="max-w-[70%] truncate underline"
          href={`/blog/${namespace}/${slug}` as any}
          title={node.title || slug}
        >
          {node.title || slug}
        </Link>
        {(meta.created_at ||
          meta.updated_at ||
          typeof meta.word_count === 'number' ||
          typeof views === 'number' ||
          typeof meta.likes_count === 'number' ||
          typeof meta.comments_count === 'number' ||
          meta.type === 'Mind') && (
          <div className="shrink-0 text-xs text-muted-foreground flex flex-wrap gap-2 justify-end">
            {meta.created_at && <span>发布 {formatDateTime(meta.created_at)}</span>}
            {meta.updated_at && meta.updated_at !== meta.created_at && (
              <span className="text-muted-foreground/70">
                更新 {formatDateTime(meta.updated_at)}
              </span>
            )}
            {typeof meta.word_count === 'number' && <span>{meta.word_count} 字</span>}
            {typeof views === 'number' && <span>{views} 次浏览</span>}
            {meta.type === 'Mind' && <span>思维导图</span>}
            {typeof meta.likes_count === 'number' && <span>{meta.likes_count} 喜欢</span>}
            {typeof meta.comments_count === 'number' && <span>{meta.comments_count} 评论</span>}
          </div>
        )}
      </div>
    )
  }

  // 渲染
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{namespace}</h1>
      <div className="space-y-3">
        {tree.map((n, idx) => {
          const isGroup = (n.children && n.children.length > 0) || n.type !== 'DOC'
          if (isGroup) {
            // 分组：递归收集并展示为一行文档
            const collectDocs = (arr?: TocNode[], depth = 1, out: TocNode[] = []) => {
              for (const child of arr || []) {
                if (isDocLike(child)) out.push(child)
                if (depth < MAX_DEPTH && child.children && child.children.length) {
                  collectDocs(child.children, depth + 1, out)
                }
              }
              return out
            }
            const docs = collectDocs(n.children)
            return (
              <details key={n.uuid || n.title || idx} className="rounded border p-2" open>
                <summary className="cursor-pointer select-none text-sm text-muted-foreground">
                  {n.title || '分组'}
                </summary>
                <div className="mt-2 space-y-2">
                  {docs.map((d) => (
                    <DocRow key={getSlug(d)} node={d} />
                  ))}
                </div>
              </details>
            )
          }
          return <DocRow key={getSlug(n)} node={n} />
        })}
      </div>
    </div>
  )
}

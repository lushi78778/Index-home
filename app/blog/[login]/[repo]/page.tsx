/**
 * 语雀知识库首页（/blog/[login]/[repo]）
 * - 获取知识库的目录树与文档元信息，按分组折叠展示最近更新文档
 * - 支持通过环境变量配置最大递归深度，兼容思维导图与文档类型
 */
import { listRepoToc, listUserPublicRepos, buildTocTree, listRepoDocsRaw } from '@/lib/yuque'
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

  // 已移除浏览量预取逻辑

  // 单行文档行
  const DocRow = ({ node }: { node: TocNode }) => {
    const slug = getSlug(node)
    if (!slug) return null
    const meta = docsMeta[slug] || {}
    return (
      <div className="rounded border px-3 py-2 flex items-center justify-between hover:bg-accent/30 transition-colors">
        <Link
          className="max-w-[70%] truncate underline"
          href={`/blog/${namespace}/${slug}` as any}
          title={node.title || slug}
        >
          {node.title || slug}
        </Link>
        {(meta.created_at || typeof meta.word_count === 'number' || meta.type === 'Mind') && (
          <div className="shrink-0 text-xs text-muted-foreground flex flex-wrap gap-2 justify-end">
            {meta.created_at && <span>发布 {formatDateTime(meta.created_at)}</span>}
            {typeof meta.word_count === 'number' && <span>{meta.word_count} 字</span>}
            {meta.type === 'Mind' && <span>思维导图</span>}
            {/* 喜欢/评论已在非正文区域移除展示 */}
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

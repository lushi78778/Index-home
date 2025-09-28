import { listRepoToc, buildTocTree, listUserPublicRepos } from '@/lib/yuque'
import { RepoTocTreeClient } from '@/components/site/repo-toc-tree-client'

export default async function RepoTocSidebar({
  namespace,
  currentSlug,
}: {
  namespace: string
  currentSlug?: string
}) {
  // 尝试直接按 namespace 获取目录；若失败再通过 id 重试
  let toc = await listRepoToc(namespace)
  if (!toc?.length) {
    try {
      const [login] = namespace.split('/')
      const repos = await listUserPublicRepos(login)
      const id = (Array.isArray(repos) ? repos : []).find((r) => r.namespace === namespace)?.id
      if (id) toc = await listRepoToc(namespace, { repoId: id })
    } catch {}
  }
  const tree = buildTocTree(toc || [])

  // 获取知识库中文名（用于顶部显示）
  let repoName: string | undefined
  try {
    const [login] = namespace.split('/')
    if (login) {
      const repos = await listUserPublicRepos(login)
      repoName = repos.find((r) => r.namespace === namespace)?.name
    }
  } catch {}

  if (!tree.length) return null

  return (
    <RepoTocTreeClient
      namespace={namespace}
      nodes={tree}
      currentSlug={currentSlug}
      repoName={repoName}
    />
  )
}

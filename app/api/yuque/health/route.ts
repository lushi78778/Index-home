import { NextResponse } from 'next/server'
import { debugProbe, listRepoDocs, listUserPublicRepos, listRepoDocsRaw } from '@/lib/yuque'

export const revalidate = 0

export async function GET(req: Request) {
  const login = process.env.YUQUE_LOGIN || ''
  const tokenPresent = Boolean(process.env.YUQUE_TOKEN)

  const url = new URL(req.url)
  const deep = url.searchParams.get('deep') === '1'
  const repoNs = url.searchParams.get('repo') || undefined
  const drafts = url.searchParams.get('drafts') === '1'

  const probe = await debugProbe(login)
  let firstRepoDocs = -1
  let firstNamespace: string | undefined
  if (probe.ok && (probe.sampleNamespaces?.length || 0) > 0) {
    firstNamespace = probe.sampleNamespaces![0]
    try {
      const repos = await listUserPublicRepos(login)
      const matched = repos.find((r) => r.namespace === firstNamespace)
      const docs = await listRepoDocs(firstNamespace, matched?.id)
      firstRepoDocs = Array.isArray(docs) ? docs.length : -1
    } catch (err) {
      firstRepoDocs = -2 // 标记获取失败
    }
  }

  // 深度模式：统计前 N 个（默认全部）知识库的文档数量
  let deepStats: Array<{ namespace: string; docsCount: number }> | undefined
  let totalDocs: number | undefined
  if (deep && probe.ok) {
    try {
      const repos = await listUserPublicRepos(login)
      deepStats = []
      totalDocs = 0
      for (const r of repos) {
        try {
          const docs = drafts
            ? await listRepoDocsRaw(r.namespace, { includeDrafts: true, repoId: r.id })
            : await listRepoDocs(r.namespace, r.id)
          const n = Array.isArray(docs) ? docs.length : -1
          const examples = Array.isArray(docs)
            ? docs.slice(0, 3).map((d: any) => ({ title: d.title, slug: d.slug, status: d.status }))
            : undefined
          deepStats.push({ namespace: r.namespace, docsCount: n, examples } as any)
          totalDocs += Math.max(0, n)
        } catch {
          deepStats.push({ namespace: r.namespace, docsCount: -2 })
        }
      }
    } catch {}
  }

  // 单个知识库调试：返回前 10 篇文档的基本信息
  let repoDocs: any[] | undefined
  if (repoNs) {
    try {
      const repos = await listUserPublicRepos(login)
      const matched = repos.find((r) => r.namespace === repoNs)
      const docs = drafts
        ? await listRepoDocsRaw(repoNs, { includeDrafts: true, repoId: matched?.id })
        : await listRepoDocs(repoNs, matched?.id)
      repoDocs = (Array.isArray(docs) ? docs : []).slice(0, 10).map((d) => ({
        id: d.id,
        title: d.title,
        slug: d.slug,
        status: d.status,
        updated_at: d.updated_at,
      }))
    } catch {}
  }

  return NextResponse.json({
    env: {
      YUQUE_LOGIN: !!login,
      YUQUE_TOKEN_present: tokenPresent,
    },
    probe,
    firstRepo: firstNamespace ? { namespace: firstNamespace, docsCount: firstRepoDocs } : null,
    deep: deep ? { totalDocs, repos: deepStats, drafts } : undefined,
    repo: repoNs ? { namespace: repoNs, drafts, docs: repoDocs } : undefined,
  })
}

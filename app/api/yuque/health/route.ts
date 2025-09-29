/**
 * 语雀健康检查与统计接口（GET /api/yuque/health）
 * - 基础信息：环境配置可用性、探测结果 debugProbe
 * - 可选统计：
 *   - deep=1：遍历用户所有公开知识库，统计文档数量（可选 drafts=1 统计草稿）
 *   - repo=ns：返回指定知识库前 10 条文档样本
 */
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
      // 暴露一些和缓存/再验证相关的环境信息，便于评估 ISR 策略
      NEXT_REVALIDATE_pages: 60 * 10,
      YUQUE_FETCH_REVALIDATE: Number(process.env.YUQUE_FETCH_REVALIDATE || 60 * 10),
    },
    probe,
    firstRepo: firstNamespace ? { namespace: firstNamespace, docsCount: firstRepoDocs } : null,
    deep: deep ? { totalDocs, repos: deepStats, drafts } : undefined,
    repo: repoNs ? { namespace: repoNs, drafts, docs: repoDocs } : undefined,
  })
}

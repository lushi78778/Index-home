/**
 * 语雀 TOC 原始调试接口（GET /api/yuque/toc-raw?repo=ns[&by=id]）
 * - 直接透传语雀的 TOC 原始响应文本，便于排查解析问题
 * - 支持通过 namespace 或 repoId（需先查询映射）两种方式获取
 */
import { NextResponse } from 'next/server'
import { fetchYuqueRawResponse, listUserPublicRepos } from '@/lib/yuque'

export const revalidate = 0

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ns = searchParams.get('repo') || ''
  const useId = searchParams.get('by') === 'id'
  if (!ns) return NextResponse.json({ error: 'missing repo' }, { status: 400 })
  try {
    if (useId) {
      const [login] = ns.split('/')
      const repos = await listUserPublicRepos(login)
      const id = (Array.isArray(repos) ? repos : []).find((r) => r.namespace === ns)?.id
      if (!id) return NextResponse.json({ error: 'no id for ns' }, { status: 404 })
      const raw = await fetchYuqueRawResponse(`/repos/${id}/toc`)
      return NextResponse.json({ by: 'id', id, raw })
    }
    const raw = await fetchYuqueRawResponse(`/repos/${encodeURIComponent(ns)}/toc`)
    return NextResponse.json({ by: 'namespace', raw })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

/**
 * 语雀 TOC 汇总接口（GET /api/yuque/toc?repo=ns）
 * - 优先通过 namespace 获取 toc；若失败，尝试通过 repoId 再次获取
 * - 当 toc 为空时，回退解析 toc_yml，输出样本与分组统计辅助定位
 */
import { NextResponse } from 'next/server'
import { fetchYuqueRawResponse, listRepoToc, listUserPublicRepos } from '@/lib/yuque'

export const revalidate = 0

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ns = searchParams.get('repo') || ''
  if (!ns) return NextResponse.json({ error: 'missing repo' }, { status: 400 })
  try {
    let toc = await listRepoToc(ns)
    if (!toc?.length) {
      try {
        const [login] = ns.split('/')
        const repos = await listUserPublicRepos(login)
        const id = (Array.isArray(repos) ? repos : []).find((r) => r.namespace === ns)?.id
        if (id) toc = await listRepoToc(ns, { repoId: id })
      } catch {}
    }
    const arr = Array.isArray(toc) ? toc : []
    const groups: Record<string, number> = {}
    for (const it of arr) {
      const p = String(it.parent_uuid || '')
      groups[p] = (groups[p] || 0) + 1
    }
    const sample = arr
      .slice(0, 20)
      .map((x) => ({
        title: x.title,
        type: x.type,
        slug: x.slug,
        url: x.url,
        parent: x.parent_uuid,
        uuid: x.uuid,
      }))
    // 如果为空，尝试直接解析原始 toc_yml 以辅助定位
    if (!arr.length) {
      try {
        const raw = await fetchYuqueRawResponse(`/repos/${encodeURIComponent(ns)}/toc`)
        const json = JSON.parse(raw.text)
        const tocYml = json?.data?.toc_yml
        let parsed: any = null
        if (typeof tocYml === 'string') {
          const mod: any = await import('yaml')
          const parse = mod.parse || mod.default?.parse
          parsed = parse ? parse(tocYml) : undefined
        }
        return NextResponse.json({
          count: 0,
          sample,
          byParent: groups,
          fallback: {
            rawHasTocYml: !!tocYml,
            parsedType: Array.isArray(parsed) ? 'array' : typeof parsed,
            parsedCount: Array.isArray(parsed) ? parsed.length : undefined,
          },
        })
      } catch {}
    }
    return NextResponse.json({ count: arr.length, sample, byParent: groups })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}

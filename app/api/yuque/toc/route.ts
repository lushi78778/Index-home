import { NextResponse } from 'next/server'
import { listRepoToc, listUserPublicRepos } from '@/lib/yuque'

const BASE = process.env.YUQUE_BASE || 'https://www.yuque.com/api/v2'
const TOKEN = process.env.YUQUE_TOKEN || ''
async function rawFetch(path: string) {
  const url = `${BASE}${path}`
  const headers: Record<string, string> = {
    'User-Agent': 'index-home-yuque-debug',
    Accept: 'application/json',
  }
  if (TOKEN) headers['X-Auth-Token'] = TOKEN
  const res = await fetch(url, { headers, cache: 'no-store' })
  const text = await res.text()
  return { status: res.status, statusText: res.statusText, text }
}

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
        const raw = await rawFetch(`/repos/${encodeURIComponent(ns)}/toc`)
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

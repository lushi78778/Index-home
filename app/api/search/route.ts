import { NextResponse } from 'next/server'
import { getMeiliClient } from '@/lib/meili'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const limit = Number(searchParams.get('limit') || '20')
  if (!q) return NextResponse.json({ data: [] })
  const client = getMeiliClient()
  if (!client) return NextResponse.json({ data: [], reason: 'MEILI_NOT_CONFIGURED' })
  const index = client.index('search')
  const res = await index.search(q, {
    limit,
    sort: ['updatedAt:desc'],
    showMatchesPosition: true,
    attributesToRetrieve: ['id', 'title', 'slug', 'type', 'namespace', 'excerpt', 'content', 'updatedAt', 'tags'],
  })
  const hits = (res.hits || []).map((h: any) => {
    // 生成基于 content 的摘要，优先使用匹配位置做裁剪
    const content = String(h.content || '')
    const excerptRaw = String(h.excerpt || '')
    let outExcerpt = ''
    const mp = (h as any)?.matchesPosition as any
    if (mp?.content && Array.isArray(mp.content) && mp.content.length > 0) {
      const pos = mp.content[0]
      const start = Math.max(0, Number(pos.start) - 120)
      const end = Math.min(content.length, Number(pos.start) + Number(pos.length) + 120)
      outExcerpt = content.slice(start, end)
    } else if (content) {
      outExcerpt = content.slice(0, 240)
    } else if (excerptRaw) {
      outExcerpt = excerptRaw.slice(0, 240)
    }
    return { ...h, excerpt: outExcerpt }
  })
  return NextResponse.json({ data: hits })
}

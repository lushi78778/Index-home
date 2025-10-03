/**
 * @file API: 语雀搜索代理
 * @description 将查询转发至语雀搜索接口，并统一返回结构 { data }。
 */
import { NextResponse } from 'next/server'
import { searchYuqueAll } from '@/lib/yuque'

export const revalidate = 60
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const limitRaw = searchParams.get('limit') || '20'
    const limit = Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : 20
    const login = (process.env.YUQUE_LOGIN || '').trim()

    if (!q) {
      return NextResponse.json({ data: [], reason: 'MISSING_Q' })
    }
    if (!login) {
      return NextResponse.json({ data: [], reason: 'MISSING_YUQUE_LOGIN' })
    }

    const items = await searchYuqueAll(login, q, { limit, includeGroups: true })
    return NextResponse.json({ data: items })
  } catch (err) {
    const msg = (err as any)?.message || String(err)
    // 在开发环境输出日志
    if (process.env.NODE_ENV !== 'production') {
      console.error('[api/yuque-search] error:', msg)
    }
    return NextResponse.json({ data: [], error: msg })
  }
}

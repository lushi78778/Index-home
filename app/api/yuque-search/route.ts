/**
 * @file API: 语雀搜索代理
 * @description 将查询转发至语雀搜索接口，并统一返回结构 { data }。
 */
import { NextResponse } from 'next/server'
import { searchYuqueAll } from '@/lib/yuque'

export const revalidate = 60

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const limit = Number(searchParams.get('limit') || '20')
  const login = process.env.YUQUE_LOGIN || ''
  if (!q || !login) {
    return NextResponse.json({ data: [] })
  }
  const items = await searchYuqueAll(login, q, { limit })
  return NextResponse.json({ data: items })
}

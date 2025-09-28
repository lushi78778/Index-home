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

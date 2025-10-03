/**
 * @file API: 语雀搜索调试（返回原始响应）
 * 仅在非生产环境启用，便于对比语雀官网搜索结果与我们代理之间的差异。
 */
import { NextResponse } from 'next/server'
import { fetchYuqueRawResponse } from '@/lib/yuque'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'DISABLED_IN_PRODUCTION' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if (!q) return NextResponse.json({ error: 'MISSING_Q' }, { status: 400 })

  // 构造语雀搜索参数：支持 type、scope、user、group、group_id（均可选）
  const type = (searchParams.get('type') || 'doc').toLowerCase()
  const scope = (searchParams.get('scope') || 'user').toLowerCase()
  const user = (searchParams.get('user') || process.env.YUQUE_LOGIN || '').trim()
  const group = (searchParams.get('group') || '').trim()
  const group_id = (searchParams.get('group_id') || '').trim()

  const p = new URLSearchParams({ q, type, scope })
  if (scope === 'user' && user) p.set('user', user)
  if (scope === 'group') {
    if (group) p.set('group', group)
    if (group_id) p.set('group_id', group_id)
  }

  const path = `/search?${p.toString()}`
  const raw = await fetchYuqueRawResponse(path)
  return NextResponse.json({
    query: Object.fromEntries(p.entries()),
    path,
    status: raw.status,
    statusText: raw.statusText,
    text: raw.text,
  })
}

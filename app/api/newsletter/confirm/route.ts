/**
 * 订阅确认接口（GET /api/newsletter/confirm?token=...）
 * - 功能：通过 Redis 中预先写入的确认 Token 交换出 email 并写入 Resend 受众列表
 * - 前置：在 /api/newsletter 开启双重确认时，已将 token->email 写入 Redis（有效期 24 小时）
 * - 失败处理：
 *   - Token 不存在/过期：返回 400 invalid_or_expired
 *   - 上游 Resend 写入失败：返回 502，并回显 upstream 错误详情
 */
import { NextResponse } from 'next/server'

import { addAudienceContact } from '@/lib/resend'
import { getRedisClient } from '@/lib/server/ratelimit'

// 请求示例：GET /api/newsletter/confirm?token=...
export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') || ''
  if (!token) return NextResponse.json({ ok: false }, { status: 400 })

  const resendKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_NEWSLETTER_AUDIENCE_ID

  const redis = getRedisClient()

  if (!redis || !resendKey || !audienceId) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  const email = await redis.get<string>(`newsletter:confirm:${token}`)
  if (!email) {
    return NextResponse.json({ ok: false, error: 'invalid_or_expired' }, { status: 400 })
  }

  const result = await addAudienceContact({ email, audienceId, apiKey: resendKey })
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: 'upstream', detail: result.detail },
      { status: 502 },
    )
  }
  await redis.del(`newsletter:confirm:${token}`)
  return NextResponse.json({ ok: true })
}

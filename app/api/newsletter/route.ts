/**
 * 订阅接口（POST /api/newsletter）
 * - 功能：将邮箱加入 Resend 的受众列表；支持「双重确认（Double Opt-In）」模式
 * - 速率限制：基于 Upstash Redis 的滑动窗口（同一 IP 5 分钟内最多 6 次）
 * - 降级策略：
 *   - 缺失 Redis/站点 URL/Resend 依赖时，直接写入受众列表（跳过确认邮件）
 *   - 发送确认邮件失败时，亦回退为直接写入（保证用户可订阅）
 * - 环境变量：
 *   - UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN：用于限流与确认 Token 存储
 *   - RESEND_API_KEY/RESEND_NEWSLETTER_AUDIENCE_ID：Resend API 与受众列表
 *   - NEWSLETTER_DOUBLE_OPT_IN：开启双重确认（true/false）
 *   - NEXT_PUBLIC_SITE_URL：用于生成确认链接
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { addAudienceContact } from '@/lib/resend'
import { getClientIp } from '@/lib/server/request'
import { enforceSlidingWindowRateLimit, getRedisClient } from '@/lib/server/ratelimit'

// 后端校验：仅校验邮箱格式
const Schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  const data = await req.json()
  const parsed = Schema.safeParse(data)
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  const email = parsed.data.email

  const ip = getClientIp(req)
  const rate = await enforceSlidingWindowRateLimit({
    identifier: `newsletter:${ip}`,
    limit: 6,
    window: '5 m',
  })
  if (!rate.success) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited', reset: rate.reset },
      { status: 429, headers: rate.headers },
    )
  }

  const resendKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_NEWSLETTER_AUDIENCE_ID
  const doubleOptIn = process.env.NEWSLETTER_DOUBLE_OPT_IN === 'true'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const redis = getRedisClient()

  // 缺少 Resend 关键配置时直接返回成功，避免阻塞前端体验
  if (!resendKey || !audienceId) {
    return NextResponse.json({ ok: true })
  }

  if (doubleOptIn) {
    const from = process.env.NEWSLETTER_FROM || 'Newsletter <noreply@example.com>'
    if (!redis || !siteUrl) {
      // 环境不完整：跳过确认流程，直接写入受众列表
    } else {
      const random = new Uint8Array(16)
      globalThis.crypto.getRandomValues(random)
      const token = Buffer.from(random).toString('base64url')
      // 将确认 Token 与邮箱绑定，24 小时内有效
      await redis.set(`newsletter:confirm:${token}`, email, { ex: 60 * 60 * 24 })
      const confirmUrl = `${siteUrl}/subscribe/confirm?token=${encodeURIComponent(token)}`
      try {
        const { Resend } = await import('resend').catch(() => ({ Resend: null as any }))
        if (!Resend) return NextResponse.json({ ok: true })
        const resend = new Resend(resendKey)
        await resend.emails.send({
          from,
          to: email,
          subject: '请确认你的订阅 / Confirm your subscription',
          html: `<p>点击以下链接确认订阅：</p><p><a href="${confirmUrl}">${confirmUrl}</a></p>`,
        })
        return NextResponse.json({ ok: true })
      } catch {
        // 邮件发送失败：回退为直接写入受众列表
      }
    }
  }

  const result = await addAudienceContact({ email, apiKey: resendKey, audienceId })
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: 'upstream', detail: result.detail },
      { status: 502 },
    )
  }
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const Schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  const data = await req.json()
  const parsed = Schema.safeParse(data)
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })
  // 速率限制（Upstash）：同一 IP 每 5 分钟最多 6 次
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (redisUrl && redisToken) {
    const redis = new Redis({ url: redisUrl, token: redisToken })
    const ratelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(6, '5 m') })
    const { success, reset, limit, remaining } = await ratelimit.limit(`newsletter:${ip}`)
    if (!success) {
      const nowSec = Math.floor(Date.now() / 1000)
      const retryAfter = Math.max(1, (reset || nowSec) - nowSec)
      const headers: Record<string, string> = { 'Retry-After': String(retryAfter) }
      if (typeof limit === 'number') headers['X-RateLimit-Limit'] = String(limit)
      if (typeof remaining === 'number') headers['X-RateLimit-Remaining'] = String(remaining)
      return NextResponse.json({ ok: false, error: 'rate_limited', reset }, { status: 429, headers })
    }
  }
  const bdToken = process.env.BUTTONDOWN_API_TOKEN
  const doubleOptIn = process.env.BUTTONDOWN_DOUBLE_OPT_IN === 'true'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  // 未配置 Buttondown 时仍返回成功，方便开发
  if (!bdToken) return NextResponse.json({ ok: true })

  // 双重确认：发送确认邮件，待用户点击确认后再触发订阅
  if (doubleOptIn) {
    const resendKey = process.env.RESEND_API_KEY
    const from = process.env.NEWSLETTER_FROM || 'Newsletter <noreply@example.com>'
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!resendKey || !redisUrl || !redisToken || !siteUrl) {
      // 环境不完备则降级为直接订阅
    } else {
      const redis = new Redis({ url: redisUrl, token: redisToken })
      // 生成一次性 token（base64url）
      const u8 = new Uint8Array(16)
      globalThis.crypto.getRandomValues(u8)
      const token = Buffer.from(u8).toString('base64url')
      await redis.set(`newsletter:confirm:${token}`, parsed.data.email, { ex: 60 * 60 * 24 })
  // 改为跳转用户可见页面，由页面再调用 API 完成确认
  const confirmUrl = `${siteUrl}/subscribe/confirm?token=${encodeURIComponent(token)}`
      try {
        const { Resend } = await import('resend').catch(() => ({ Resend: null as any }))
        if (!Resend) return NextResponse.json({ ok: true })
        const resend = new Resend(resendKey)
        await resend.emails.send({
          from,
          to: parsed.data.email,
          subject: '请确认你的订阅 / Confirm your subscription',
          html: `<p>点击以下链接确认订阅：</p><p><a href="${confirmUrl}">${confirmUrl}</a></p>`,
        })
        return NextResponse.json({ ok: true })
      } catch {
        // 邮件失败则降级为直接订阅
      }
    }
  }

  // 直接订阅 Buttondown（默认或降级路径）
  try {
    const res = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${bdToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: parsed.data.email, referrer_url: siteUrl }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json({ ok: false, error: 'upstream', detail: text }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

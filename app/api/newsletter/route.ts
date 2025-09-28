import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const Schema = z.object({ email: z.string().email() })
const RESEND_AUDIENCES_ENDPOINT = 'https://api.resend.com/audiences'

async function addContact({
  email,
  audienceId,
  apiKey,
}: {
  email: string
  audienceId: string
  apiKey: string
}) {
  const res = await fetch(`${RESEND_AUDIENCES_ENDPOINT}/${audienceId}/contacts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })
  if (res.status === 409) return { ok: true }
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    return { ok: false as const, detail }
  }
  return { ok: true }
}

export async function POST(req: Request) {
  const data = await req.json()
  const parsed = Schema.safeParse(data)
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  const email = parsed.data.email

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
      return NextResponse.json(
        { ok: false, error: 'rate_limited', reset },
        { status: 429, headers },
      )
    }
  }

  const resendKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_NEWSLETTER_AUDIENCE_ID
  const doubleOptIn = process.env.NEWSLETTER_DOUBLE_OPT_IN === 'true'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''

  if (!resendKey || !audienceId) {
    return NextResponse.json({ ok: true })
  }

  if (doubleOptIn) {
    const from = process.env.NEWSLETTER_FROM || 'Newsletter <noreply@example.com>'
    if (!redisUrl || !redisToken || !siteUrl) {
      // 环境不完整则降级为直接写入
    } else {
      const redis = new Redis({ url: redisUrl, token: redisToken })
      const random = new Uint8Array(16)
      globalThis.crypto.getRandomValues(random)
      const token = Buffer.from(random).toString('base64url')
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
        // 邮件失败则降级直接写入
      }
    }
  }

  const result = await addContact({ email, apiKey: resendKey, audienceId })
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: 'upstream', detail: result.detail },
      { status: 502 },
    )
  }
  return NextResponse.json({ ok: true })
}

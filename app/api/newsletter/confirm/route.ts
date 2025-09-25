import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

// GET /api/newsletter/confirm?token=...
export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') || ''
  if (!token) return NextResponse.json({ ok: false }, { status: 400 })

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  const bdToken = process.env.BUTTONDOWN_API_TOKEN
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  if (!redisUrl || !redisToken || !bdToken) return NextResponse.json({ ok: false }, { status: 500 })

  const redis = new Redis({ url: redisUrl, token: redisToken })
  const email = await redis.get<string>(`newsletter:confirm:${token}`)
  if (!email) return NextResponse.json({ ok: false, error: 'invalid_or_expired' }, { status: 400 })

  try {
    const res = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: { Authorization: `Token ${bdToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, referrer_url: siteUrl }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json({ ok: false, error: 'upstream', detail: text }, { status: 502 })
    }
    await redis.del(`newsletter:confirm:${token}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

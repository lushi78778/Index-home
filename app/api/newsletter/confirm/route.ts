import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

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

// GET /api/newsletter/confirm?token=...
export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token') || ''
  if (!token) return NextResponse.json({ ok: false }, { status: 400 })

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  const resendKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_NEWSLETTER_AUDIENCE_ID

  if (!redisUrl || !redisToken || !resendKey || !audienceId) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  const redis = new Redis({ url: redisUrl, token: redisToken })
  const email = await redis.get<string>(`newsletter:confirm:${token}`)
  if (!email) {
    return NextResponse.json({ ok: false, error: 'invalid_or_expired' }, { status: 400 })
  }

  const result = await addContact({ email, audienceId, apiKey: resendKey })
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: 'upstream', detail: result.detail },
      { status: 502 },
    )
  }
  await redis.del(`newsletter:confirm:${token}`)
  return NextResponse.json({ ok: true })
}

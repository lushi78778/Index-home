import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const MAX_MESSAGE_LENGTH = 2000
const CONTACT_RATE_LIMIT = { limit: 3, window: '5 m' as const }

// Use Node.js runtime to allow importing server-only email libraries safely
export const runtime = 'nodejs'

// Server 端表单校验（与客户端一致）
const Schema = z.object({
  name: z.string().trim().min(2, '姓名至少 2 个字符').max(60, '姓名长度过长'),
  email: z.string().email('邮箱格式不正确').max(254),
  message: z
    .string()
    .trim()
    .min(10, '内容太短')
    .max(MAX_MESSAGE_LENGTH, `内容请控制在 ${MAX_MESSAGE_LENGTH} 字符以内`),
  website: z.string().trim().optional(), // 蜜罐字段，机器人常会填写
})

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: Request) {
  const data = await req.json()
  const parsed = Schema.safeParse(data)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
  }
  const payload = parsed.data

  if (payload.website) {
    // 蜜罐命中
    return NextResponse.json({ ok: true })
  }
  // 速率限制（Upstash）：同一 IP 每 5 分钟最多 3 次
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (redisUrl && redisToken) {
    const redis = new Redis({ url: redisUrl, token: redisToken })
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(CONTACT_RATE_LIMIT.limit, CONTACT_RATE_LIMIT.window),
    })
    const { success, reset, limit, remaining } = await ratelimit.limit(`contact:${ip}`)
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

  // 发送邮件（可选，需配置 RESEND_API_KEY 和接收邮箱）
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL
  if (!apiKey || !to) {
    // 未配置时直接返回成功，避免阻塞
    return NextResponse.json({ ok: true })
  }

  try {
    // Prefer static specifier import to avoid webpack critical dependency warning
    let Resend: any = null
    try {
      ;({ Resend } = await import('resend'))
    } catch {
      Resend = null
    }
    if (!Resend) {
      // 依赖未安装，视为成功（示例环境）
      return NextResponse.json({ ok: true })
    }
    const resend = new Resend(apiKey)
    // 发件人：优先使用 NEWSLETTER_FROM，否则使用 shortName + noreply@域名
    const defaultFromDomain = process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
      : 'example.com'
    const fromDisplay =
      process.env.NEWSLETTER_FROM || `Website Contact <noreply@${defaultFromDomain}>`

    const submittedAt = new Date().toISOString()
    const text = `Name: ${payload.name}\nEmail: ${payload.email}\nIP: ${ip}\nSubmitted: ${submittedAt}\n\n${payload.message}`
    const html = `
      <h1>新的联系表单</h1>
      <p><strong>姓名：</strong> ${escapeHtml(payload.name)}</p>
      <p><strong>邮箱：</strong> ${escapeHtml(payload.email)}</p>
      <p><strong>IP：</strong> ${escapeHtml(ip)}</p>
      <p><strong>时间：</strong> ${escapeHtml(submittedAt)}</p>
      <hr />
      <p>${escapeHtml(payload.message).replace(/\n/g, '<br />')}</p>
    `.trim()

    await resend.emails.send({
      from: fromDisplay,
      to,
      subject: `[Contact] ${payload.name}`,
      reply_to: payload.email,
      text,
      html,
      tags: [{ name: 'form', value: 'contact' }],
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Resend error', err)
    return NextResponse.json({ ok: false, error: 'email_failed' }, { status: 502 })
  }
}

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Use Node.js runtime to allow importing server-only email libraries safely
export const runtime = 'nodejs'

// Server 端表单校验（与客户端一致）
const Schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
  website: z.string().optional(), // 蜜罐
})

// TODO: 接入真实邮件服务（如 Resend/SMTP），并加上速率限制（如 Upstash Ratelimit）
export async function POST(req: Request) {
  const data = await req.json()
  const parsed = Schema.safeParse(data)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 })
  }
  if (parsed.data.website) {
    // 蜜罐命中
    return NextResponse.json({ ok: true })
  }
  // 速率限制（Upstash）：同一 IP 每 5 分钟最多 3 次
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (redisUrl && redisToken) {
    const redis = new Redis({ url: redisUrl, token: redisToken })
    const ratelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, '5 m') })
    const { success, reset } = await ratelimit.limit(`contact:${ip}`)
    if (!success) {
      return NextResponse.json({ ok: false, error: 'rate_limited', reset }, { status: 429 })
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
    await resend.emails.send({
      from: 'Website Contact <noreply@xray.top>',
      to,
      subject: `[Contact] ${parsed.data.name}`,
      text: `Name: ${parsed.data.name}\nEmail: ${parsed.data.email}\n\n${parsed.data.message}`,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Resend error', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

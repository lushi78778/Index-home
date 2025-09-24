import { NextResponse } from 'next/server'
import { z } from 'zod'
// 注意：不要静态导入第三方 SDK 以免在未安装依赖时阻塞开发环境
// 使用动态导入，仅在配置了密钥时才加载

// 简单内存级速率限制（示例）：同一 IP 每 5 分钟最多 3 次
const RATE_LIMIT_WINDOW = 5 * 60 * 1000
const RATE_LIMIT_MAX = 3
const rateMap = new Map<string, number[]>()

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
  // 速率限制
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const now = Date.now()
  const arr = rateMap.get(ip) || []
  const recent = arr.filter((t) => now - t < RATE_LIMIT_WINDOW)
  if (recent.length >= RATE_LIMIT_MAX) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }
  recent.push(now)
  rateMap.set(ip, recent)

  // 发送邮件（可选，需配置 RESEND_API_KEY 和接收邮箱）
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL
  if (!apiKey || !to) {
    // 未配置时直接返回成功，避免阻塞
    return NextResponse.json({ ok: true })
  }

  try {
  const resendPkg = 'resend'
  const mod = await import(resendPkg as any).catch(() => null as any)
    if (!mod?.Resend) {
      // 依赖未安装，视为成功（示例环境）
      return NextResponse.json({ ok: true })
    }
    const resend = new mod.Resend(apiKey)
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

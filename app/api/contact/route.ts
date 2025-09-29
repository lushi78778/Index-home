/**
 * 联系我们表单接口（POST /api/contact）
 * - 功能：接收并验证表单，进行限流，必要时发送邮件到站点维护者邮箱
 * - 安全：
 *   - 服务端 Zod 校验（与客户端保持一致）
 *   - 蜜罐字段 website（机器人常填）命中即短路返回成功
 *   - Upstash Redis 限流：同一 IP 5 分钟内最多 3 次
 * - 依赖：配置 RESEND_API_KEY 和 CONTACT_TO_EMAIL 才会发送邮件；否则直接返回成功
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getClientIp } from '@/lib/server/request'
import { enforceSlidingWindowRateLimit } from '@/lib/server/ratelimit'

const MAX_MESSAGE_LENGTH = 2000
const CONTACT_RATE_LIMIT = { limit: 3, window: '5 m' as const }

// 指定 Node.js 运行时：允许安全地按需引入仅服务器可用的邮件依赖
export const runtime = 'nodejs'

// 服务端表单校验（与客户端保持一致的规则）
const Schema = z.object({
  name: z.string().trim().min(2, '姓名至少 2 个字符').max(60, '姓名长度过长'),
  email: z.string().email('邮箱格式不正确').max(254),
  message: z
    .string()
    .trim()
    .min(10, '内容太短')
    .max(MAX_MESSAGE_LENGTH, `内容请控制在 ${MAX_MESSAGE_LENGTH} 字符以内`),
  website: z.string().trim().optional(), // 蜜罐字段：机器人常会填写
})

// 简单 HTML 转义，防止邮件内容被注入恶意标签
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
    // 蜜罐命中：静默返回成功，不提示机器人
    return NextResponse.json({ ok: true })
  }
  // 速率限制（Upstash）：同一 IP 每 5 分钟最多 3 次
  const ip = getClientIp(req)
  const rate = await enforceSlidingWindowRateLimit({
    identifier: `contact:${ip}`,
    limit: CONTACT_RATE_LIMIT.limit,
    window: CONTACT_RATE_LIMIT.window,
  })
  if (!rate.success) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited', reset: rate.reset },
      { status: 429, headers: rate.headers },
    )
  }

  // 发送邮件（可选）：需配置 RESEND_API_KEY 和 CONTACT_TO_EMAIL
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL
  if (!apiKey || !to) {
    // 未配置邮件能力时：直接返回成功，避免阻塞表单体验
    return NextResponse.json({ ok: true })
  }

  try {
    // 使用动态导入以避免在打包阶段引入不必要的依赖
    let Resend: any = null
    try {
      ;({ Resend } = await import('resend'))
    } catch {
      Resend = null
    }
    if (!Resend) {
      // 依赖未安装：视为成功（示例/本地环境）
      return NextResponse.json({ ok: true })
    }
    const resend = new Resend(apiKey)
    // 发件人：优先使用 NEWSLETTER_FROM，否则使用 noreply@站点域名
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

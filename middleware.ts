import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// 全站安全与隐私响应头（可按需调整 CSP 与策略）
export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  // Content Security Policy（简单示例，注意与实际第三方资源对齐）
  const plausibleHost = 'plausible.io'
  const csp = [
    "default-src 'self'",
    "img-src 'self' data: https:",
    // TODO: 去除 'unsafe-inline'，改为 nonce/hash；此处暂保留以避免样式闪烁
    "style-src 'self' 'unsafe-inline'",
    // 放行可选的 Plausible 分析脚本来源
    `script-src 'self' 'unsafe-inline' https://${plausibleHost}`,
    "font-src 'self' data: https:",
    `connect-src 'self' https://${plausibleHost}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "worker-src 'self' blob:",
  ].join('; ')

  res.headers.set('Content-Security-Policy', csp)
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  // 强制 HTTPS（生产环境生效，Vercel 上为 HSTS 生效域）
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  return res
}

// 应用到所有路由（可根据需要排除静态资源）
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

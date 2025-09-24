import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// 全站安全与隐私响应头（可按需调整 CSP 与策略）
export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  // Content Security Policy（简单示例，注意与实际第三方资源对齐）
  const csp = [
    "default-src 'self'",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    "font-src 'self' data: https:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "worker-src 'self' blob:",
  ].join('; ')

  res.headers.set('Content-Security-Policy', csp)
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  return res
}

// 应用到所有路由（可根据需要排除静态资源）
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

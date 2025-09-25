import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// 全站安全与隐私响应头（可按需调整 CSP 与策略）
export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  // 为每个请求生成一次性 nonce（Edge-safe）
  const arr = new Uint8Array(16)
  // globalThis.crypto 为 Edge/Web 可用 API
  globalThis.crypto.getRandomValues(arr)
  let s = ''
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i])
  const nonce = btoa(s)
  res.headers.set('x-nonce', nonce)
  // Content Security Policy（简单示例，注意与实际第三方资源对齐）
  const plausibleHost = 'plausible.io'
  const csp = [
    "default-src 'self'",
    "img-src 'self' data: https:",
    // 样式仍暂时允许 inline，后续可替换为严格白名单/nonce/hash
    "style-src 'self' 'unsafe-inline'",
    // 脚本：移除 unsafe-inline，使用 nonce 收紧内联脚本，保留 Plausible 域
    `script-src 'self' 'nonce-${nonce}' https://${plausibleHost}`,
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

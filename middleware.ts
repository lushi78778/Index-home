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
  const giscusHost = 'giscus.app'
  const isProd = (globalThis as any).process?.env?.NODE_ENV === 'production'

  const directives: string[] = []
  directives.push("default-src 'self'")
  directives.push("img-src 'self' data: https:")
  // 样式：生产环境去掉全局 'unsafe-inline'，仅允许元素引入；属性级允许 inline，兼顾如 style 属性（CSP3 支持）
  if (isProd) {
    directives.push("style-src 'self'")
    directives.push("style-src-elem 'self'")
    directives.push("style-src-attr 'unsafe-inline'")
  } else {
    directives.push("style-src 'self' 'unsafe-inline'")
  }
  // 脚本：使用 nonce 收紧内联脚本；允许第三方域；开发环境放宽 eval 以兼容 React Refresh
  const scriptSrc = [
    "script-src",
    "'self'",
    `'nonce-${nonce}'`,
    `https://${plausibleHost}`,
    `https://${giscusHost}`,
  ]
  if (!isProd) scriptSrc.push("'unsafe-eval'")
  directives.push(scriptSrc.join(' '))

  directives.push("font-src 'self' data: https:")
  directives.push(`connect-src 'self' https://${plausibleHost}`)
  // 允许嵌入来自 giscus 的评论 iframe
  directives.push(`frame-src 'self' https://${giscusHost}`)
  directives.push("frame-ancestors 'none'")
  directives.push("base-uri 'self'")
  directives.push("form-action 'self'")
  directives.push("worker-src 'self' blob:")
  directives.push("object-src 'none'")
  if (isProd) directives.push('upgrade-insecure-requests')

  const csp = directives.join('; ')

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

/**
 * @file Next.js 中间件
 * @description
 * 本文件导出的 `middleware` 函数会在每个匹配的请求被处理之前在 Edge Runtime 中运行。
 * 主要职责包括：
 * 1.  **国际化 (i18n) 路由处理**：
 *     -   使用 `next-intl` 的中间件来处理语言检测和路由重写/重定向。
 *     -   它会根据 URL 前缀、cookie 或 `Accept-Language` 头来确定用户的语言偏好。
 * 2.  **安全响应头设置**：
 *     -   生成并注入一个一次性的 `nonce` 值，用于内容安全策略 (CSP)。
 *     -   构建并应用严格的 `Content-Security-Policy` (CSP)，以减少跨站脚本 (XSS) 风险。
 *     -   设置其他安全相关的 HTTP 头，如 `Referrer-Policy`, `X-Content-Type-Options` 等，以增强应用的安全性。
 */

import { NextResponse, type NextRequest } from 'next/server'
import { siteConfig } from './src/config/site'

// 简易的 Locale 协商：优先 Cookie，其次 Accept-Language，最后默认语言。
function detectLocale(req: NextRequest): string {
  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && siteConfig.locales.includes(cookieLocale as any)) {
    return cookieLocale
  }

  const header = req.headers.get('accept-language') || ''
  const accepted = header
    .split(',')
    .map((part) => part.trim().split(';')[0])
    .filter(Boolean)

  for (const l of accepted) {
    const base = l.toLowerCase().split('-')[0]
    if (siteConfig.locales.includes(base as any)) return base
  }
  return siteConfig.defaultLocale
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1) 若 URL 以 /zh 或 /en 等前缀访问，则做 308 重定向到“无前缀”版本，并设置 Cookie
  const match = pathname.match(/^\/(\w{2})(\/.*)?$/)
  if (match) {
    const maybeLocale = match[1]
    if (siteConfig.locales.includes(maybeLocale as any)) {
      const rest = match[2] || '/'
      const url = new URL(rest, req.url)
      const redirect = NextResponse.redirect(url, 308)
      redirect.cookies.set('NEXT_LOCALE', maybeLocale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
      // 同时向下游传递 locale 信息（尽管这次请求会被重定向）
      redirect.headers.set('x-locale', maybeLocale)
      return redirect
    }
  }

  // 2) 无前缀路径：仅做语言检测与上下文传递，不改写 URL
  const locale = detectLocale(req)
  const res = NextResponse.next()
  // 传递给下游（app/layout.tsx）使用
  res.headers.set('x-locale', locale)
  // 持久化到 Cookie，便于后续请求
  res.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })

  // 2. 接下来，为响应添加安全头。
  // 使用 Web Crypto API 生成一个安全的、一次性的 nonce 值。
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // 定义内容安全策略 (CSP) 的指令。
  // 这是一个白名单机制，只允许从指定的来源加载资源。
  const cspDirectives = [
    "default-src 'self'", // 默认策略：只信任同源内容。
    // 脚本来源：允许同源、Plausible 和 Giscus 的脚本。
    // 在生产环境使用 nonce 来增强内联脚本的安全性。
    // 在开发环境允许 'unsafe-eval' 以支持 React Refresh 等功能。
    `script-src 'self' 'nonce-${nonce}' https://plausible.io https://giscus.app ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'", // 样式来源：允许同源和内联样式。
    "img-src 'self' data: https:", // 图片来源：允许同源、data URI 和所有 https 来源。
    "font-src 'self' data:", // 字体来源：允许同源和 data URI。
    "connect-src 'self' https://plausible.io", // API 请求来源：允许连接到同源和 Plausible。
    "frame-src 'self' https://giscus.app", // Iframe 来源：允许嵌入 Giscus 评论。
    "frame-ancestors 'none'", // 禁止页面被嵌入到其他网站的 iframe 中。
    "form-action 'self'", // 表单提交目标：只允许提交到同源。
    "base-uri 'self'", // 限制 `<base>` 标签的 URL。
    "object-src 'none'", // 禁止使用 `<object>`, `<embed>`, `<applet>` 标签。
    "upgrade-insecure-requests", // 自动将 http 请求升级为 https。
  ];

  const csp = cspDirectives.join('; ');

  // 将安全头设置到响应对象上。
  res.headers.set('x-nonce', nonce); // 将 nonce 传递给下游组件（如 app/layout.tsx）。
  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  return res;
}

// 配置中间件的匹配器 (Matcher)。
// 这个中间件将应用于除了特定文件夹和文件类型之外的所有请求路径。
export const config = {
  matcher: [
    // 排除 Next.js 内部路径 (`_next`)、Vercel 部署路径 (`_vercel`)
    // 以及所有包含文件扩展名的静态资源（如 .png, .svg, .js）。
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
}

/**
 * @file next-intl 配置文件
 * @description
 * 本文件用于配置 `next-intl` 库，它负责处理应用的国际化 (i18n)。
 * `getRequestConfig` 是一个由 `next-intl` 提供的函数，用于在服务器端为每个请求加载相应的翻译资源。
 */

import { getRequestConfig } from 'next-intl/server'
import { siteConfig } from '@/config/site'

// 从站点配置中导入支持的语言列表和默认语言
export const locales = siteConfig.locales
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = siteConfig.defaultLocale

export default getRequestConfig(async () => {
  // 兼容：在新版本使用 requestLocale()，老版本则没有该 API
  let hinted: string | undefined = undefined
  try {
    // 动态引入，避免在旧版 next-intl 上的类型错误
    const mod = require('next-intl/server') as any
    if (typeof mod.requestLocale === 'function') {
      hinted = await mod.requestLocale()
    }
  } catch {}
  // 在不使用路径前缀的情况下（无 /en、/zh 段），`locale` 可能为空。
  // 解析顺序：Cookie -> 自定义请求头（x-locale）-> Accept-Language -> requestLocale() -> 默认值
  function resolveLocale(): string {
    // 1) 来自中间件设置的 Cookie
    try {
      // 动态导入，避免在 Edge/Node 环境下的静态分析问题
      const { cookies, headers } = require('next/headers') as typeof import('next/headers')
      const c = cookies().get('NEXT_LOCALE')?.value
      if (c && locales.includes(c as any)) return c

      // 2) 自定义响应头（开发/某些平台下也能透传到请求头）
      const h = headers()
      const hl = h.get('x-locale') || ''
      if (hl && locales.includes(hl as any)) return hl

      // 3) Accept-Language 协商
      const al = h.get('accept-language') || ''
      const accepted = al
        .split(',')
        .map((p) => p.trim().split(';')[0])
        .filter(Boolean)
      for (const l of accepted) {
        const base = l.toLowerCase().split('-')[0]
        if (locales.includes(base as any)) return base
      }
    } catch (_) {
      // 在某些环境拿不到 next/headers 时，忽略错误并走下面的回退
    }

    // 4) 若 requestLocale() 有返回且合法，则使用
    if (hinted && locales.includes(hinted as any)) return hinted

    // 5) 最后回退到默认语言
    return defaultLocale
  }

  const resolved = resolveLocale()

  return {
    locale: resolved,
    messages: (await import(`./messages/${resolved}.json`)).default,
  }
})

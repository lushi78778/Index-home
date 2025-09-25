/**
 * @file next-intl 配置文件
 * @description
 * 本文件用于配置 `next-intl` 库，它负责处理应用的国际化 (i18n)。
 * `getRequestConfig` 是一个由 `next-intl` 提供的函数，用于在服务器端为每个请求加载相应的翻译资源。
 */

import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { siteConfig } from '@/config/site'

// 从站点配置中导入支持的语言列表和默认语言
export const locales = siteConfig.locales
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = siteConfig.defaultLocale

export default getRequestConfig(async ({ locale }) => {
  // 校验请求的 locale 是否在支持的语言列表中
  // 如果不支持，则调用 notFound()，这将导致 Next.js 渲染 404 页面
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // 根据有效的 locale，动态导入对应的翻译文件
  // 例如，如果 locale 是 'en'，它将加载 `messages/en.json`
  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})

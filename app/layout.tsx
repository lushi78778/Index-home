/**
 * @file 根布局 (Root Layout)
 * @description
 * 这是整个应用的根布局组件，定义了所有页面共享的 HTML 框架。
 * 它负责：
 * 1. 设置全局的 HTML lang 属性和字体。
 * 2. 定义站点的基础元数据 (Metadata) 和视口 (Viewport) 配置，用于 SEO 和移动端体验。
 * 3. 加载并应用全局样式和字体。
 * 4. 注入分析脚本（如 Plausible）。
 * 5. 设置全局上下文提供者，如主题 (ThemeProvider)、国际化 (NextIntlClientProvider)、
 *    命令面板 (CommandProvider) 和消息提示 (ToastProvider)。
 * 6. 渲染通用的页面结构，包括页头 (Header) 和页脚 (Footer)。
 */

import type { Metadata, Viewport } from 'next'
import '../src/styles/globals.css'
import { Header } from '@/components/site/header'
import { Footer } from '@/components/site/footer'
import { ThemeProvider } from '@/components/site/theme-provider'
import { siteConfig } from '@/config/site'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { headers } from 'next/headers'
import { ToastProvider } from '@/components/ui/toast'
import { CommandProvider } from '@/components/site/command-provider'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { JsonLd } from '@/components/site/json-ld'
import { ConsentBanner } from '@/components/site/consent-banner'

// 使用 next/font 优化字体加载。
// 这会将 Inter 字体在构建时下载到服务器，并在加载时自托管，
// 从而减少网络请求、防止布局偏移 (CLS)，并提升性能。
const inter = Inter({ subsets: ['latin'], display: 'swap' })

// 定义站点的全局元数据，主要用于 SEO。
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url), // 设置所有相对 URL 的基础路径
  title: {
    default: siteConfig.name, // 默认标题
    template: `%s | ${siteConfig.shortName}`, // 页面标题模板
  },
  description: siteConfig.description,
  // 对于启用了基于 Referer 的 CDN 防盗链（如 Yuque 的 cdn.nlark.com），
  // 建议在前端也声明不发送 referrer，避免跨站资源 403。
  referrer: 'no-referrer',
  openGraph: {
    // 设定 Open Graph 配置（用于 Facebook、LinkedIn 等社交分享）
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.shortName,
    type: 'website',
    images: [`${siteConfig.url}/opengraph-image`],
  },
  twitter: {
    // 配置 Twitter Cards（控制 Twitter 上的分享卡片展示）
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [`${siteConfig.url}/opengraph-image`],
  },
  alternates: {
    canonical: '/', // 指定规范 URL
    types: { 'application/rss+xml': `${siteConfig.url}/rss.xml` },
  },
}

// 定义视口配置，用于控制页面在移动设备上的显示方式。
export const viewport: Viewport = {
  themeColor: [
    // 根据系统颜色模式设置浏览器 UI 的主题色
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 在服务器端读取从中间件 (middleware.ts) 注入的请求头信息
  const hdrs = headers()
  // 获取 CSP (Content Security Policy) 的 nonce 值，用于内联脚本
  const nonce = hdrs.get('x-nonce') || undefined
  // 获取当前用户的区域设置 (locale)，默认为 'zh'
  const locale = hdrs.get('x-locale') || 'zh'

  // 根据 locale 动态加载对应的翻译文件
  const messageLoaders = {
    zh: () => import('@/i18n/messages/zh.json'),
    en: () => import('@/i18n/messages/en.json'),
  } as const
  const loadMessages = messageLoaders[locale as keyof typeof messageLoaders] || messageLoaders.zh
  const messages = (await loadMessages()).default

  // 告诉 next-intl 当前请求使用的 locale（不会渲染任何内容）
  setRequestLocale(locale)

  return (
    // 使用 suppressHydrationWarning，忽略浏览器扩展导致的 `<html>` 属性不匹配警告
    <html lang={locale} suppressHydrationWarning className={inter.className}>
      <body>
        {/* 注入 Plausible 分析脚本。仅当环境变量中配置了 domain 时生效。 */}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            nonce={nonce} // 使用 nonce 以符合 CSP 策略
          />
        )}

        {/* 全局上下文提供者 (Providers) */}
        <ThemeProvider>
          <ToastProvider>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <CommandProvider>
                {/* 无障碍设计：提供一个“跳到主要内容”的链接，方便使用屏幕阅读器的用户 */}
                <a
                  href="#main"
                  className="sr-only focus:not-sr-only fixed left-2 top-2 z-50 rounded bg-primary px-3 py-1 text-primary-foreground"
                >
                  跳到主要内容
                </a>

                {/* 页面通用结构 */}
                <Header />
                <main id="main" className="container mx-auto px-4 py-8">
                  {children}
                </main>
                <Footer />

                {/* 全站底部提示：Cookie 与使用说明告知（非阻断、可关闭） */}
                <ConsentBanner />

                {/* 全站结构化数据：WebSite + SearchAction */}
                <JsonLd
                  data={{
                    '@context': 'https://schema.org',
                    '@type': 'WebSite',
                    name: siteConfig.name,
                    url: siteConfig.url,
                    potentialAction: {
                      '@type': 'SearchAction',
                      target: `${siteConfig.url}/search?q={search_term_string}`,
                      'query-input': 'required name=search_term_string',
                    },
                  }}
                />

                {/* 全站结构化数据：Person（作者/站点主体） */}
                <JsonLd
                  data={{
                    '@context': 'https://schema.org',
                    '@type': 'Person',
                    name: siteConfig.author.name,
                    url: siteConfig.author.url,
                    sameAs: [
                      siteConfig.social?.github,
                      siteConfig.social?.twitter,
                      siteConfig.social?.email ? `mailto:${siteConfig.social.email}` : undefined,
                    ].filter(Boolean),
                  }}
                />

                {/* 可选增强：站点主导航（有助于搜索引擎理解信息架构） */}
                <JsonLd
                  data={{
                    '@context': 'https://schema.org',
                    '@type': 'SiteNavigationElement',
                    name: '主导航',
                    url: siteConfig.url,
                    about: undefined,
                    hasPart: [
                      { '@type': 'WebPage', name: '首页', url: siteConfig.url },
                      { '@type': 'WebPage', name: '博客', url: `${siteConfig.url}/blog` },
                      { '@type': 'WebPage', name: '项目', url: `${siteConfig.url}/projects` },
                      { '@type': 'WebPage', name: '关于', url: `${siteConfig.url}/about` },
                      { '@type': 'WebPage', name: '联系', url: `${siteConfig.url}/contact` },
                      { '@type': 'WebPage', name: '订阅', url: `${siteConfig.url}/subscribe` },
                      { '@type': 'WebPage', name: '搜索', url: `${siteConfig.url}/search` },
                    ],
                  }}
                />
              </CommandProvider>
            </NextIntlClientProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

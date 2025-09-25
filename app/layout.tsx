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

// 使用 next/font 自托管字体，减少 CLS 并提升渲染稳定性
const inter = Inter({ subsets: ['latin'], display: 'swap' })

// 全局站点元信息（SEO 基础）
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.shortName}` },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.shortName,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
  },
  alternates: { canonical: '/' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 从中间件注入的响应头读取 CSP Nonce
  const nonce = headers().get('x-nonce') || undefined
  return (
    <html lang="zh-CN" suppressHydrationWarning className={inter.className}>
      <body>
        {/* 分析：Plausible（可选，存在 NEXT_PUBLIC_PLAUSIBLE_DOMAIN 时注入） */}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            nonce={nonce as any}
          />
        )}
        {/* 主题切换与全局 Toast 提供者 */}
        <ThemeProvider>
          <ToastProvider>
          <CommandProvider>
          {/* 无障碍：跳到主要内容 */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only fixed left-2 top-2 z-50 rounded bg-primary px-3 py-1 text-primary-foreground"
          >
            跳到主要内容
          </a>
          {/* 站点头部（导航/搜索入口/主题切换） */}
          <Header />
          <main id="main" className="container mx-auto px-4 py-8">{children}</main>
          {/* 页脚（版权/社交/订阅） */}
          <Footer />
          </CommandProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

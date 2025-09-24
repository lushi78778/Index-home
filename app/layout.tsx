import type { Metadata, Viewport } from 'next'
import '../src/styles/globals.css'
import { Header } from '@/components/site/header'
import { Footer } from '@/components/site/footer'
import { ThemeProvider } from '@/components/site/theme-provider'
import { siteConfig } from '@/config/site'

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
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        {/* 主题切换上下文（浅/深色） */}
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  )
}

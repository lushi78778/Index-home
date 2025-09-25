import type { Metadata, Viewport } from 'next'
import '../../src/styles/globals.css'
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
import type { Locale } from '@/i18n/config'
import i18nConfig, { locales } from '@/i18n/config'
import { notFound } from 'next/navigation'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

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

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: Locale }
}) {
  const nonce = headers().get('x-nonce') || undefined
  const locale = params?.locale
  if (!locales.includes(locale)) return notFound()
  const { messages } = await i18nConfig({ locale } as any)
  if (!messages) return notFound()

  return (
    <html lang={locale} suppressHydrationWarning className={inter.className}>
      <body>
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script defer data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN} src="https://plausible.io/js/script.js" nonce={nonce as any} />
        )}
        <ThemeProvider>
          <ToastProvider>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <CommandProvider>
                <a href="#main" className="sr-only focus:not-sr-only fixed left-2 top-2 z-50 rounded bg-primary px-3 py-1 text-primary-foreground">跳到主要内容</a>
                <Header />
                <main id="main" className="container mx-auto px-4 py-8">{children}</main>
                <Footer />
              </CommandProvider>
            </NextIntlClientProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

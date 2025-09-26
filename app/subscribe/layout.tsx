import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { JsonLd } from '@/components/site/json-ld'

export const metadata: Metadata = {
  title: '订阅',
  description: '邮件订阅说明与表单（示例）。',
  alternates: { canonical: `${siteConfig.url}/subscribe` },
}

export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: siteConfig.url },
            { '@type': 'ListItem', position: 2, name: '订阅', item: `${siteConfig.url}/subscribe` },
          ],
        }}
      />
    </>
  )
}

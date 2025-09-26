import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { JsonLd } from '@/components/site/json-ld'

export const metadata: Metadata = {
  title: '联系',
  description: '联系表单（邮箱发送 + 速率限制 + 蜜罐）',
  alternates: { canonical: `${siteConfig.url}/contact` },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: siteConfig.url },
            { '@type': 'ListItem', position: 2, name: '联系', item: `${siteConfig.url}/contact` },
          ],
        }}
      />
    </>
  )
}

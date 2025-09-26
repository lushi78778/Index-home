import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { JsonLd } from '@/components/site/json-ld'

export const metadata: Metadata = {
  title: 'Now',
  description: '当前在做什么（定期更新）。',
  alternates: { canonical: `${siteConfig.url}/now` },
}

export default function NowPage() {
  return (
    <div className="prose dark:prose-invert">
      <h1>Now</h1>
      <p>当前在做什么（定期更新）。</p>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: siteConfig.url },
            { '@type': 'ListItem', position: 2, name: 'Now', item: `${siteConfig.url}/now` },
          ],
        }}
      />
    </div>
  )
}

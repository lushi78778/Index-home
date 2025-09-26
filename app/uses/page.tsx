import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { JsonLd } from '@/components/site/json-ld'

export const metadata: Metadata = {
  title: 'Uses',
  description: '设备 / 软件 / 服务清单。',
  alternates: { canonical: `${siteConfig.url}/uses` },
}

export default function UsesPage() {
  return (
    <div className="prose dark:prose-invert">
      <h1>Uses</h1>
      <p>设备 / 软件 / 服务清单（后续补充）。</p>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: siteConfig.url },
            { '@type': 'ListItem', position: 2, name: 'Uses', item: `${siteConfig.url}/uses` },
          ],
        }}
      />
    </div>
  )
}

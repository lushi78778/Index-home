import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'

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
    </div>
  )
}

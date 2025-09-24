import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'

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
    </div>
  )
}

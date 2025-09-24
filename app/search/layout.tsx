import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: '搜索',
  description: '离线索引的站内搜索（MiniSearch）。',
  alternates: { canonical: `${siteConfig.url}/search` },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}

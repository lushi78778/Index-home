import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: '订阅',
  description: '邮件订阅说明与表单（示例）。',
  alternates: { canonical: `${siteConfig.url}/subscribe` },
}

export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
  return children
}

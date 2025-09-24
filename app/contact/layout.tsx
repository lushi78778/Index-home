import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: '联系',
  description: '联系表单（邮箱发送 + 速率限制 + 蜜罐）',
  alternates: { canonical: `${siteConfig.url}/contact` },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}

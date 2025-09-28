import { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import ConfirmClient from './confirm-client'

export const metadata: Metadata = {
  title: '订阅确认',
  description: '确认你的邮件订阅以完成双重验证流程。',
  alternates: { canonical: `${siteConfig.url}/subscribe/confirm` },
  robots: { index: false, follow: true },
  openGraph: {
    title: '订阅确认',
    description: '确认邮件订阅并解锁最新内容更新。',
    url: `${siteConfig.url}/subscribe/confirm`,
  },
}

export default function ConfirmPage() {
  return <ConfirmClient />
}

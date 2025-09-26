import { Metadata } from 'next'
import ConfirmClient from './confirm-client'

export const metadata: Metadata = {
  title: '订阅确认',
  description: '确认你的邮件订阅',
}

export default function ConfirmPage() {
  return <ConfirmClient />
}

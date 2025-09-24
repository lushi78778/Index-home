import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: '关于',
  description: '关于我：个人介绍、履历时间线、技能矩阵、下载简历。',
  alternates: { canonical: `${siteConfig.url}/about` },
}

export default function AboutPage() {
  return (
    <div className="prose dark:prose-invert">
      <h1>关于我</h1>
      <p>更完整的个人介绍、履历时间线、技能矩阵、下载简历（后续补充）。</p>
    </div>
  )
}

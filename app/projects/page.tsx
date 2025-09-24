import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllProjects } from '@/lib/content'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: '项目',
  description: '项目集合：技术栈、角色与链接。',
  alternates: { canonical: `${siteConfig.url}/projects` },
}

// 项目列表：支持标签/类型筛选（后续扩展）
export default function ProjectsPage() {
  const projects = getAllProjects()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">项目</h1>
      <ul className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <li key={p.slug} className="rounded-lg border p-4">
            <Link className="text-lg font-medium underline" href={`/projects/${p.slug}`}>
              {p.title}
            </Link>
            <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

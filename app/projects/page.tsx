import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllProjects } from '@/lib/content'
import { siteConfig } from '@/config/site'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
          <li key={p.slug}>
            <Card>
              <CardHeader>
                <CardTitle>
                  <Link className="underline" href={`/projects/${p.slug}`}>{p.title}</Link>
                </CardTitle>
                <CardDescription>{p.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {p.tech?.slice(0, 6).map((t) => (
                    <Badge key={t} variant="outline">{t}</Badge>
                  ))}
                  {p.tags?.slice(0, 3).map((t) => (
                    <Badge key={t} variant="secondary">#{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}

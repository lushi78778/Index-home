import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllProjects } from '@/lib/content'
import { siteConfig } from '@/config/site'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { JsonLd } from '@/components/site/json-ld'

export async function generateMetadata({ searchParams }: { searchParams: { tag?: string; featured?: string } }): Promise<Metadata> {
  const hasFilter = !!(searchParams?.tag?.trim() || searchParams?.featured === '1')
  return {
    title: '项目',
    description: '项目集合：技术栈、角色与链接。',
    alternates: { canonical: `${siteConfig.url}/projects` },
    robots: hasFilter ? { index: false, follow: true } : undefined,
  }
}

// 项目列表：支持标签筛选（?tag=xxx）
export default function ProjectsPage({ searchParams }: { searchParams: { tag?: string; featured?: string } }) {
  const all = getAllProjects()
  const tag = searchParams.tag?.trim()
  const onlyFeatured = searchParams.featured === '1'
  let projects = tag ? all.filter((p) => p.tags?.includes(tag)) : all
  if (onlyFeatured) projects = projects.filter((p) => p.featured)

  // 生成标签云（按出现次数排序，取前 20）
  const tagCount = new Map<string, number>()
  all.forEach((p) => p.tags?.forEach((t) => tagCount.set(t, (tagCount.get(t) || 0) + 1)))
  const tagList = Array.from(tagCount.entries())
    .map(([t, c]) => ({ t, c }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 20)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">项目</h1>
      <div className="text-sm text-muted-foreground">
        {tag ? (
          <span>
            标签 <span className="font-medium">{tag}</span> · 共 {projects.length} 个
          </span>
        ) : (
          <span>共 {projects.length} 个项目</span>
        )}
      </div>

      {/* 标签筛选器 */}
      {tagList.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/projects" className={`rounded border px-2 py-1 text-sm ${!tag && !onlyFeatured ? 'bg-accent' : ''}`}>全部</Link>
          <Link href="/projects?featured=1" className={`rounded border px-2 py-1 text-sm ${onlyFeatured ? 'bg-accent' : ''}`}>精选</Link>
          {tagList.map(({ t, c }) => (
            <Link
              key={t}
              href={`/projects?tag=${encodeURIComponent(t)}`}
              className={`rounded border px-2 py-1 text-sm hover:bg-accent ${tag === t ? 'bg-accent' : ''}`}
            >
              #{t} <span className="text-muted-foreground">({c})</span>
            </Link>
          ))}
        </div>
      )}

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
                  {p.tags?.slice(0, 6).map((t) => (
                    <Badge key={t} variant="secondary">#{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
        {projects.length === 0 && (
          <li className="text-sm text-muted-foreground">暂无结果，试试其他标签。</li>
        )}
      </ul>
      {/* 结构化数据：项目列表 ItemList */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: projects.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${siteConfig.url}/projects/${p.slug}`,
            name: p.title,
          })),
          numberOfItems: projects.length,
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: siteConfig.url },
            { '@type': 'ListItem', position: 2, name: '项目', item: `${siteConfig.url}/projects` },
          ],
        }}
      />
    </div>
  )
}


import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllProjects } from '@/lib/content'
import { siteConfig } from '@/config/site'
import { JsonLd } from '@/components/site/json-ld'

export function generateStaticParams() {
  const tags = new Set<string>()
  getAllProjects().forEach((p) => p.tags.forEach((t) => tags.add(t)))
  return Array.from(tags).map((t) => ({ tag: t }))
}

export async function generateMetadata({ params }: { params: { tag: string } }): Promise<Metadata> {
  const title = `标签：${params.tag}`
  const url = `${siteConfig.url}/tags/${encodeURIComponent(params.tag)}`
  return {
    title,
    alternates: { canonical: url },
    openGraph: { title, url },
    twitter: { title },
  }
}

export default function TagPage({ params }: { params: { tag: string } }) {
  const projects = getAllProjects().filter((p) => p.tags.includes(params.tag))
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">标签：{params.tag}</h1>
      <section>
        <h2 className="font-semibold">项目</h2>
        <ul className="list-disc pl-5">
          {projects.map((p) => (
            <li key={p.slug}>
              <Link className="underline" href={`/projects/${p.slug}` as any}>
                {p.title}
              </Link>
            </li>
          ))}
          {projects.length === 0 && <li>暂无项目。</li>}
        </ul>
      </section>
      {/* 结构化数据：按标签的内容列表 */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `标签：${params.tag}`,
          itemListElement: [
            ...projects.map((p) => ({
              '@type': 'ListItem',
              name: p.title,
              url: `${siteConfig.url}/projects/${p.slug}`,
            })),
          ].map((it, i) => ({ ...it, position: i + 1 })),
          numberOfItems: projects.length,
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: siteConfig.url },
            { '@type': 'ListItem', position: 2, name: '标签', item: `${siteConfig.url}/tags` },
            {
              '@type': 'ListItem',
              position: 3,
              name: params.tag,
              item: `${siteConfig.url}/tags/${encodeURIComponent(params.tag)}`,
            },
          ],
        }}
      />
    </div>
  )
}

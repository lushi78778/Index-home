import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAllProjects } from '@/lib/content'
import { siteConfig } from '@/config/site'
import { Badge } from '@/components/ui/badge'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkGfm from 'remark-gfm'
import { mdxComponents } from '@/components/mdx/mdx-components'

export const revalidate = 60 * 60 * 24

export function generateStaticParams() {
  return getAllProjects().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const project = getAllProjects().find((p) => p.slug === params.slug)
  if (!project) return {}
  const url = `${siteConfig.url}/projects/${project.slug}`
  const title = project.title
  const description = project.description
  const image = `${siteConfig.url}/projects/${project.slug}/opengraph-image`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: siteConfig.shortName,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const project = getAllProjects().find((p) => p.slug === params.slug)
  if (!project) return notFound()
  return (
    <article className="prose dark:prose-invert max-w-none">
      <h1>{project.title}</h1>
      <p className="text-sm text-muted-foreground">{project.description}</p>
      {(project.tech?.length || project.tags?.length) ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {project.tech?.map((t) => (
            <Badge key={t} variant="outline">{t}</Badge>
          ))}
          {project.tags?.map((t) => (
            <Badge key={t} variant="secondary">#{t}</Badge>
          ))}
        </div>
      ) : null}

      {/* 项目正文（MDX 渲染） */}
      {project.content && (
        <MDXRemote
          source={project.content}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm as any],
              rehypePlugins: [rehypeSlug as any, [rehypeAutolinkHeadings as any, { behavior: 'wrap' }]],
            },
          }}
          components={mdxComponents as any}
        />
      )}

      {/* 结构化数据：CreativeWork + BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            {
              '@context': 'https://schema.org',
              '@type': 'CreativeWork',
              name: project.title,
              description: project.description,
              inLanguage: 'zh-CN',
              url: `${siteConfig.url}/projects/${project.slug}`,
              author: { '@type': 'Person', name: siteConfig.author.name, url: siteConfig.author.url },
              keywords: project.tags?.length ? project.tags.join(', ') : undefined,
            },
            null,
            0,
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: '首页', item: siteConfig.url },
                { '@type': 'ListItem', position: 2, name: '项目', item: `${siteConfig.url}/projects` },
                { '@type': 'ListItem', position: 3, name: project.title, item: `${siteConfig.url}/projects/${project.slug}` },
              ],
            },
            null,
            0,
          ),
        }}
      />
    </article>
  )
}

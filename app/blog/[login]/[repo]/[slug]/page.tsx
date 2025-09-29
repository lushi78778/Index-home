/**
 * 语雀文章详情页（/blog/[login]/[repo]/[slug]）
 * - 根据动态路由参数获取语雀文档详情，支持 MindMap 思维导图渲染
 * - 提供知识库目录、页内目录与结构化数据 JSON-LD，增强导航与 SEO
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import RepoTocSidebar from '@/components/site/repo-toc-sidebar'
import { Toc } from '@/components/site/toc'
import { InlineTocPanel } from '@/components/site/inline-toc-panel'
import { MindMapCanvas } from '@/components/site/mind-map-canvas'
import {
  getDocDetail,
  listRepoDocsRaw,
  listRepoMindMap,
  type MindMapDiagram,
} from '@/lib/yuque'
import { sanitizeHtml } from '@/lib/html'
import { formatDateTime } from '@/lib/datetime'

export const revalidate = 60 * 10

type PageParams = { params: { login: string; repo: string; slug: string } }

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { login, repo, slug } = params
  const namespace = `${login}/${repo}`
  const detail = await getDocDetail(namespace, slug)
  if (!detail) return {}
  const title = `${detail.title} – ${siteConfig.name}`
  const description = siteConfig.description
  const url = `${siteConfig.url}/blog/${namespace}/${slug}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: 'article',
      url,
    },
  }
}

export default async function Page({ params }: PageParams) {
  const { login, repo, slug } = params
  const namespace = `${login}/${repo}`
  const detail = await getDocDetail(namespace, slug)
  if (!detail) return notFound()

  const isMindMap = (detail as any)?.format === 'lakemind' || (detail as any)?.type === 'Mind'
  let mindDiagram: MindMapDiagram | null = null
  if (isMindMap) {
    mindDiagram = await listRepoMindMap(namespace, slug)
  }

  let repoDocs: Array<{
    slug: string
    title: string
    createdAt?: string
    updatedAt?: string
    wordCount?: number
    hits?: number
    likes?: number
    comments?: number
  }> = []
  try {
    const docs = await listRepoDocsRaw(namespace, { includeDrafts: true })
    repoDocs = (docs || []).map((d: any) => ({
      slug: String(d.slug),
      title: d.title,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      wordCount: d.word_count,
      hits: d.hits,
      likes: d.likes_count,
      comments: d.comments_count,
    }))
    repoDocs.sort(
      (a, b) =>
        +new Date(b.updatedAt || b.createdAt || 0) - +new Date(a.updatedAt || a.createdAt || 0),
    )
  } catch {}

  const repoTitle = (detail as any)?.book?.name || namespace

  const hasHtml = typeof detail.body_html === 'string' && detail.body_html.trim().length > 0
  const safeHtml = hasHtml ? sanitizeHtml(detail.body_html!) : ''

  let fallbackHtml = ''
  if (!hasHtml && !isMindMap && detail.body) {
    try {
      const { marked } = await import('marked')
      const rendered = await marked.parse(detail.body)
      fallbackHtml = sanitizeHtml(rendered)
    } catch (err) {
      console.error('[yuque] markdown fallback failed', err)
    }
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: detail.title,
    author: {
      '@type': 'Person',
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    mainEntityOfPage: `${siteConfig.url}/blog/${namespace}/${slug}`,
    datePublished: detail.created_at,
    dateModified: detail.updated_at,
    wordCount: detail.word_count,
    interactionStatistic:
      typeof detail.hits === 'number'
        ? [
            {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/ViewAction',
              userInteractionCount: detail.hits,
            },
          ]
        : undefined,
  }

  // 已移除浏览量显示，因此无需查询视图计数

  return (
    <div className="container mx-auto grid grid-cols-[280px_minmax(0,1fr)_260px] gap-6 py-6">
      {/* 左侧：知识库 TOC（目录树） */}
      <aside className="hidden lg:block sticky top-24 h-[calc(100vh-6rem)] overflow-auto pr-2">
        <RepoTocSidebar namespace={namespace} currentSlug={slug} />
      </aside>

      {/* 中间：正文 */}
      <article className="prose prose-slate dark:prose-invert max-w-none">
        <h1 className="!mb-4">{detail.title}</h1>
        <div className="mb-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>发布 {formatDateTime(detail.created_at)}</span>
          {typeof detail.word_count === 'number' && <span>{detail.word_count} 字</span>}
          {/* 喜欢/评论已在非正文区域移除展示 */}
        </div>
        <InlineTocPanel docs={repoDocs} namespace={namespace} repoName={repoTitle} />
        {isMindMap ? (
          mindDiagram ? (
            <MindMapCanvas diagram={mindDiagram} />
          ) : (
            <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
              暂无法解析此思维导图内容，请前往语雀查看原文。
            </div>
          )
        ) : (
          <>
            {(hasHtml || fallbackHtml) && (
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: hasHtml ? safeHtml : fallbackHtml }}
              />
            )}

            {!hasHtml && !fallbackHtml && detail.body && (
              <pre className="rounded-md border bg-muted/30 p-4 text-xs text-muted-foreground">
                {detail.body}
              </pre>
            )}
          </>
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </article>

      {/* 右侧：本页标题目录 */}
      <aside className="hidden xl:block sticky top-24 h-[calc(100vh-6rem)] overflow-auto pl-2">
        <Toc />
      </aside>
    </div>
  )
}

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAllPosts, getPostBySlug } from '@/lib/content'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkGfm from 'remark-gfm'
import rehypePrettyCode from 'rehype-pretty-code'
import { mdxComponents } from '@/components/mdx/mdx-components'
import Link from 'next/link'
import { ReadingProgress } from '@/components/site/reading-progress'
import { siteConfig } from '@/config/site'
import GithubSlugger from 'github-slugger'
import { BackToTop } from '@/components/site/back-to-top'
import { JsonLd } from '@/components/site/json-ld'
import { GiscusComments } from '@/components/site/giscus'
import { relatedByTags } from '@/lib/recommend'

// 可选：按天增量再验证（ISR）
export const revalidate = 60 * 60 * 24 // 24 小时

export function generateStaticParams() {
  // 预生成所有文章静态路径（SSG + ISR 可选）
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

// 针对文章详情页的 SEO/OG 元数据
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (!post) return {}

  const url = `${siteConfig.url}/blog/${post.slug}`
  const title = post.title
  const description = post.excerpt || siteConfig.description
  const image = post.ogImage || post.cover || `${siteConfig.url}/blog/${post.slug}/opengraph-image`

  return {
    title,
    description,
    alternates: { canonical: post.canonicalUrl || url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      siteName: siteConfig.shortName,
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      authors: [siteConfig.author.name],
      tags: post.tags,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

// 服务端提取 H2/H3 作为目录（与 rehype-slug 一致使用 github-slugger 算法）
function extractHeadings(md: string): { id: string; text: string; level: 2 | 3 }[] {
  const slugger = new GithubSlugger()
  const lines = md.split(/\r?\n/)
  const items: { id: string; text: string; level: 2 | 3 }[] = []
  let inFence = false
  for (let raw of lines) {
    // 跳过代码块内的行
    if (/^```|^~~~/.test(raw.trim())) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const m = /^(#{2,3})\s+(.+)$/.exec(raw)
    if (!m) continue
    const level = m[1].length === 2 ? 2 : 3
    // 去掉行尾样式井号与内联链接/强调等标记的简易处理
    let text = m[2].replace(/\s+#+\s*$/, '').trim()
    // 将 [文本](url) 简化为 文本
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    const id = slugger.slug(text)
    items.push({ id, text, level: level as 2 | 3 })
  }
  return items
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const posts = getAllPosts()
  const idx = posts.findIndex((p) => p.slug === params.slug)
  const post = idx >= 0 ? getPostBySlug(params.slug) : null
  if (!post) return notFound()

  const prev = idx > 0 ? posts[idx - 1] : null
  const next = idx < posts.length - 1 ? posts[idx + 1] : null
  const toc = extractHeadings(post.content)
  const pageUrl = `${siteConfig.url}/blog/${post.slug}`
  const seriesPosts = post.series
    ? posts
        .filter((p) => p.series === post.series)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : []
  const seriesIndex = post.series ? seriesPosts.findIndex((p) => p.slug === post.slug) : -1

  // 简易相关推荐：按标签交集评分，排除当前文章，取前 4 条
  // 若没有任何标签命中，则优先回退到同系列文章；再不行，回退到最新文章
  let related = relatedByTags(post, posts, 4)
  if (related.length === 0) {
    if (seriesPosts.length > 1) {
      related = seriesPosts.filter((p) => p.slug !== post.slug).slice(0, 4)
    } else {
      related = posts.filter((p) => p.slug !== post.slug).slice(0, 4)
    }
  }

  return (
    <article className="prose dark:prose-invert max-w-none">
      <ReadingProgress />
      <BackToTop />
      <h1>{post.title}</h1>
      <div className="text-sm text-muted-foreground">
        {new Date(post.date).toLocaleDateString()} · {post.readingTime} 分钟阅读
      </div>
      {/* 服务端目录（SSR 渲染，稳定锚点） */}
      {toc.length > 0 && (
        <nav className="mb-6 rounded-md border p-3 text-sm">
          <div className="mb-2 font-medium">目录</div>
          <ul className="space-y-1">
            {toc.map((it) => (
              <li key={it.id} className={it.level === 3 ? 'pl-4' : ''}>
                <a className="underline" href={`#${it.id}`}>
                  {it.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <MDXRemote
        source={post.content}
        options={{
          mdxOptions: {
            // 由于不同 vfile/unist 类型定义版本差异，这里进行断言绕过类型冲突
            remarkPlugins: [remarkGfm as any],
            rehypePlugins: [
              rehypeSlug as any,
              [rehypeAutolinkHeadings as any, { behavior: 'wrap' }],
              // 开发环境为了提升编译和渲染速度，关闭重量级高亮
              ...(process.env.NODE_ENV === 'development'
                ? []
                : ([[rehypePrettyCode as any, { theme: 'github-dark' }]] as any)),
            ],
          },
        }}
        components={mdxComponents as any}
      />

      {/* 系列导航 */}
      {post.series && seriesPosts.length > 0 && (
        <section className="mt-6 rounded-md border p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <div className="font-medium">系列：{post.series}</div>
            <div className="text-muted-foreground">
              {seriesIndex + 1} / {seriesPosts.length}
            </div>
          </div>
          <ol className="list-decimal pl-5 text-sm">
            {seriesPosts.map((sp) => (
              <li key={sp.slug} className="mb-1">
                {sp.slug === post.slug ? (
                  <span className="font-medium">{sp.title}</span>
                ) : (
                  <Link className="underline" href={`/blog/${sp.slug}` as any}>
                    {sp.title}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 评论区：紧跟在正文后，位于上下篇导航之前 */}
      <GiscusComments />

      {/* 分隔线下移到评论之后 */}
      <hr />

      <div className="mt-6 flex justify-between text-sm">
        <div>
          {prev && (
            <Link className="underline" href={`/blog/${prev.slug}` as any}>
              ← 上一篇：{prev.title}
            </Link>
          )}
        </div>
        <div>
          {next && (
            <Link className="underline" href={`/blog/${next.slug}` as any}>
              下一篇：{next.title} →
            </Link>
          )}
        </div>
      </div>

      {/* 相关推荐 */}
      {related.length > 0 && (
        <section className="mt-8 rounded-md border p-4" aria-label="相关推荐">
          <div className="mb-2 font-medium">相关推荐</div>
          <ul className="list-disc pl-5 text-sm">
            {related.map((rp) => (
              <li key={rp.slug}>
                <Link className="underline" href={`/blog/${rp.slug}` as any}>
                  {rp.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 结构化数据：BlogPosting + （可选）CreativeWorkSeries + BreadcrumbList + Person */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt || undefined,
          datePublished: post.date,
          dateModified: post.updated || post.date,
          inLanguage: post.lang,
          mainEntityOfPage: pageUrl,
          author: { '@type': 'Person', name: siteConfig.author.name, url: siteConfig.author.url },
          publisher: {
            '@type': 'Person',
            name: siteConfig.author.name,
            url: siteConfig.author.url,
          },
          image: post.ogImage || post.cover ? [post.ogImage || (post.cover as string)] : undefined,
          keywords: post.tags && post.tags.length ? post.tags.join(', ') : undefined,
          isPartOf: post.series
            ? [
                { '@type': 'Blog', name: siteConfig.name, url: siteConfig.url },
                { '@type': 'CreativeWorkSeries', name: post.series },
              ]
            : { '@type': 'Blog', name: siteConfig.name, url: siteConfig.url },
        }}
      />
      {post.series && seriesPosts.length > 0 && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'CreativeWorkSeries',
            name: post.series,
            url: `${siteConfig.url}/blog`,
            sameAs: undefined,
            // 用 ItemList 表示系列内文章顺序
            hasPart: {
              '@type': 'ItemList',
              itemListElement: seriesPosts.map((sp, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `${siteConfig.url}/blog/${sp.slug}`,
                name: sp.title,
              })),
            },
          }}
        />
      )}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: siteConfig.url },
            { '@type': 'ListItem', position: 2, name: '博客', item: `${siteConfig.url}/blog` },
            { '@type': 'ListItem', position: 3, name: post.title, item: pageUrl },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: siteConfig.author.name,
          url: siteConfig.author.url,
        }}
      />
    </article>
  )
}

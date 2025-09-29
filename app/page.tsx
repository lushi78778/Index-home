/**
 * @file 首页 (Home Page)
 * @description 展示个人信息、常用入口、最近文章、精选项目，以及结构化数据标记。
 */
import Link from 'next/link'
import { getAllProjects } from '@/lib/content'
import { listAllPublicDocs, listUserPublicRepos } from '@/lib/yuque'
import { siteConfig } from '@/config/site'
import { formatDateTime } from '@/lib/datetime'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { JsonLd } from '@/components/site/json-ld'

// 首页：Hero、自我介绍、主要链接、最近文章、精选项目、社交链接
export const revalidate = 60 * 10

export default async function HomePage() {
  const login = process.env.YUQUE_LOGIN || ''
  const includeDrafts = process.env.YUQUE_INCLUDE_DRAFTS === 'true'
  const yuquePosts = login ? await listAllPublicDocs(login, { includeDrafts }) : []
  const repos = login ? await listUserPublicRepos(login) : []
  const repoNameMap = new Map<string, string>(repos.map((r) => [r.namespace, r.name || r.slug]))
  const quickLinks = Array.isArray(siteConfig.quickLinks) ? siteConfig.quickLinks : []
  // 最近文章：按发布时间（created_at）由近及远排序，取前 10
  const postsRaw = [...yuquePosts]
    .sort((a, b) => +new Date(b.doc.created_at) - +new Date(a.doc.created_at))
    .slice(0, 10)

  const posts = postsRaw.map((it) => ({
    namespace: it.namespace,
    slugOnly: it.doc.slug,
    slug: `${it.namespace}/${it.doc.slug}`,
    title: it.doc.title,
    repo: repoNameMap.get(it.namespace) || it.repo || it.namespace.split('/')[1],
    createdAt: it.doc.created_at,
    // 不再展示更新时间与浏览量，保留发布与可选字数
    wordCount: typeof it.doc.word_count === 'number' ? it.doc.word_count : undefined,
  }))

  // 已移除浏览量回填逻辑
  const projects = getAllProjects().slice(0, 4)
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">你好，我是 {siteConfig.author.name}</h1>
        <p className="text-muted-foreground">
          这里是我的个人主页，专注于 Web、前端工程与数字产品。
        </p>
        <div className="flex gap-3">
          <Link href={"/blog" as any} className="underline">
            阅读博客
          </Link>
          <Link href={"/projects" as any} className="underline">
            查看项目
          </Link>
          <Link href={"/contact" as any} className="underline">
            联系我
          </Link>
          <Link href={"/subscribe" as any} className="underline">
            订阅
          </Link>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          {siteConfig.social?.github && (
            <a
              className="underline"
              href={siteConfig.social.github}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          )}
          {siteConfig.social?.twitter && (
            <a
              className="underline"
              href={siteConfig.social.twitter}
              target="_blank"
              rel="noreferrer"
            >
              Twitter
            </a>
          )}
          {siteConfig.social?.email && (
            <a className="underline" href={`mailto:${siteConfig.social.email}`}>
              Email
            </a>
          )}
        </div>
      </section>

      {quickLinks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">常用入口</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => {
              if (!link?.url || !link?.title) return null
              const isExternal = /^https?:/i.test(link.url)
              return (
                <Link
                  key={`${link.title}-${link.url}`}
                  href={link.url as any}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noreferrer' : undefined}
                  className="block rounded-lg border p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="text-base font-medium">{link.title}</div>
                  {link.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">最近文章</h2>
          <Link href={"/blog" as any} className="text-sm underline">
            更多 →
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无文章。</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {posts.map((p) => (
              <li key={p.slug} className="flex items-center justify-between px-3 py-2">
                <Link className="max-w-[70%] truncate underline" href={`/blog/${p.slug}` as any}>
                  {p.title}
                </Link>
                <div className="shrink-0 text-xs text-muted-foreground flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <span className="hidden sm:inline text-muted-foreground/80">{p.repo}</span>
                  <span>发布 {formatDateTime(p.createdAt)}</span>
                  <span className="flex gap-2">
                    {typeof p.wordCount === 'number' && <span>{p.wordCount} 字</span>}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">精选项目</h2>
          <Link href={"/projects" as any} className="text-sm underline">
            全部项目 →
          </Link>
        </div>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无项目。</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <li key={p.slug}>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Link className="underline" href={`/projects/${p.slug}` as any}>
                        {p.title}
                      </Link>
                    </CardTitle>
                    <CardDescription>{p.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {p.tech?.slice(0, 6).map((t) => (
                        <Badge key={t} variant="outline">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 根布局已注入 Person（站点主体），此处去重 */}
      {/* 结构化数据：WebSite + Sitelinks searchbox */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: siteConfig.name,
          url: siteConfig.url,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${siteConfig.url}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      {/* 结构化数据：最近文章列表 ItemList */}
      {posts.length > 0 && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: '最近文章',
            itemListElement: posts.map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: p.title,
              url: `${siteConfig.url}/blog/${p.slug}`,
            })),
            numberOfItems: posts.length,
          }}
        />
      )}
      {/* 结构化数据：精选项目列表 ItemList */}
      {projects.length > 0 && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: '精选项目',
            itemListElement: projects.map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: p.title,
              url: `${siteConfig.url}/projects/${p.slug}`,
            })),
            numberOfItems: projects.length,
          }}
        />
      )}
    </div>
  )
}

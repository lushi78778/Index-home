import Link from 'next/link'
import { getAllPosts, getAllProjects } from '@/lib/content'
import { siteConfig } from '@/config/site'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { JsonLd } from '@/components/site/json-ld'

// 首页：Hero、自我介绍、主要链接、最近文章、精选项目、社交链接
export default function HomePage() {
  const posts = getAllPosts().slice(0, 5)
  const projects = getAllProjects().slice(0, 4)
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">你好，我是 {siteConfig.author.name}</h1>
        <p className="text-muted-foreground">这里是我的个人主页，专注于 Web、前端工程与数字产品。</p>
        <div className="flex gap-3">
          <Link href="/blog" className="underline">阅读博客</Link>
          <Link href="/projects" className="underline">查看项目</Link>
          <Link href="/contact" className="underline">联系我</Link>
          <Link href="/subscribe" className="underline">订阅</Link>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          {siteConfig.social?.github && (
            <a className="underline" href={siteConfig.social.github} target="_blank" rel="noreferrer">GitHub</a>
          )}
          {siteConfig.social?.twitter && (
            <a className="underline" href={siteConfig.social.twitter} target="_blank" rel="noreferrer">Twitter</a>
          )}
          {siteConfig.social?.email && (
            <a className="underline" href={`mailto:${siteConfig.social.email}`}>Email</a>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">最近文章</h2>
          <Link href="/blog" className="text-sm underline">更多 →</Link>
        </div>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无文章。</p>
        ) : (
          <ul className="space-y-3">
            {posts.map((p) => (
              <li key={p.slug}>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Link className="underline" href={`/blog/${p.slug}` as any}>{p.title}</Link>
                    </CardTitle>
                    {p.excerpt && <CardDescription>{p.excerpt}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex flex-wrap gap-2">
                        {p.tags?.slice(0, 3).map((t) => (
                          <Badge key={t} variant="secondary">#{t}</Badge>
                        ))}
                      </div>
                      <div>{new Date(p.date).toLocaleDateString()}</div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">精选项目</h2>
          <Link href="/projects" className="text-sm underline">全部项目 →</Link>
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
                      <Link className="underline" href={`/projects/${p.slug}` as any}>{p.title}</Link>
                    </CardTitle>
                    <CardDescription>{p.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {p.tech?.slice(0, 6).map((t) => (
                        <Badge key={t} variant="outline">{t}</Badge>
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
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteConfig.name,
        url: siteConfig.url,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteConfig.url}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      }} />
      {/* 结构化数据：最近文章列表 ItemList */}
      {posts.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: '最近文章',
          itemListElement: posts.map((p, i) => ({
            '@type': 'ListItem', position: i + 1, name: p.title, url: `${siteConfig.url}/blog/${p.slug}`
          })),
          numberOfItems: posts.length,
        }} />
      )}
      {/* 结构化数据：精选项目列表 ItemList */}
      {projects.length > 0 && (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: '精选项目',
          itemListElement: projects.map((p, i) => ({
            '@type': 'ListItem', position: i + 1, name: p.title, url: `${siteConfig.url}/projects/${p.slug}`
          })),
          numberOfItems: projects.length,
        }} />
      )}
    </div>
  )
}

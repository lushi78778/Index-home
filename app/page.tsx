import Link from 'next/link'
import { getAllPosts, getAllProjects } from '@/lib/content'
import { siteConfig } from '@/config/site'

// 首页：Hero、自我介绍、主要链接、最近文章、精选项目、社交链接
export default function HomePage() {
  const posts = getAllPosts().slice(0, 5)
  const projects = getAllProjects().slice(0, 4)
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">你好，我是 XRAY</h1>
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
              <li key={p.slug} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Link className="font-medium underline" href={`/blog/${p.slug}` as any}>{p.title}</Link>
                  {p.excerpt && <p className="text-sm text-muted-foreground">{p.excerpt}</p>}
                </div>
                <div className="ml-4 shrink-0 text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString()}</div>
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
              <li key={p.slug} className="rounded-lg border p-4">
                <Link className="text-lg font-medium underline" href={`/projects/${p.slug}` as any}>{p.title}</Link>
                <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 结构化数据：Person（站点主体） */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            {
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: siteConfig.author.name,
              url: siteConfig.url,
            },
            null,
            0,
          ),
        }}
      />
    </div>
  )
}

import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { JsonLd } from '@/components/site/json-ld'
import { getAllProjects } from '@/lib/content'

export const metadata: Metadata = {
  title: '关于',
  description: '关于我：个人介绍与基于项目自动汇总的技能概览。',
  alternates: { canonical: `${siteConfig.url}/about` },
}

export default function AboutPage() {
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.author.name,
    url: siteConfig.author.url,
    sameAs: [siteConfig.social.github, siteConfig.social.twitter].filter(Boolean),
    email: siteConfig.social.email,
    jobTitle: 'Software Engineer',
    worksFor: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  }

  // 从项目聚合技能：统计 tech 与 tags 的出现频率，取 Top N
  const projects = getAllProjects()
  const countMap = new Map<string, number>()
  for (const p of projects) {
    p.tech?.forEach((t) => countMap.set(t, (countMap.get(t) || 0) + 1))
    p.tags?.forEach((t) => countMap.set(t, (countMap.get(t) || 0) + 1))
  }
  const topSkills = Array.from(countMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 16)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">关于我</h1>

      <section className="prose dark:prose-invert [text-wrap:balance] [word-break:keep-all]">
        <p>
          你好，我是 {siteConfig.author.name}。理科出身，非科班，自学走到现在。
          我更看重把事讲清楚、把系统做扎实：能跑得快，也要易维护、易扩展。
        </p>
        <p>
          我会用 AI 提高效率，但不盲从。看不懂的东西，我会啃透它，再决定要不要用、怎么用。
          写博客和整理知识库，就是把问题拆开、验证，然后沉淀成可复用的方法。
        </p>
        <p>
          你可以在这里看到我做过的项目、学习笔记和一些实践记录。如果某篇文章或某个项目对你有帮助，也欢迎和我交流。
          完整英文简历请见{' '}
          <a className="underline" href="/resume">
            /resume
          </a>
          。
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">技能概览（基于项目）</h2>
        {topSkills.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无数据，请先添加一些项目。</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topSkills.map((s) => (
              <span
                key={s.name}
                className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                title={`出现次数：${s.count}`}
              >
                {s.name}
              </span>
            ))}
          </div>
        )}
      </section>

      <JsonLd data={person} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: siteConfig.url },
            { '@type': 'ListItem', position: 2, name: '关于', item: `${siteConfig.url}/about` },
          ],
        }}
      />
    </div>
  )
}

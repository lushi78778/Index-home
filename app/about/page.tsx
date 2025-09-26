import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { JsonLd } from '@/components/site/json-ld'
import { PrintResumeButton } from '@/components/site/print-resume'

export const metadata: Metadata = {
  title: '关于',
  description: '关于我：个人介绍、履历时间线、技能矩阵、下载简历。',
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

  const timeline = [
    {
      time: '2024 - 至今',
      title: '全栈工程师 / 技术负责人',
      detail: '聚焦 Next.js、边缘计算与内容平台建设，推动性能与工程效率提升。',
    },
    {
      time: '2022 - 2024',
      title: '前端工程师',
      detail: '主导设计系统落地，沉淀组件库与可访问性规范，优化 Lighthouse 95+。',
    },
  ]

  const skills = [
    { name: 'Web / Framework', items: ['Next.js', 'React', 'Node.js', 'Vite'] },
    { name: 'Language', items: ['TypeScript', 'JavaScript', 'SQL'] },
    { name: 'Infra', items: ['Vercel', 'Cloudflare', 'Docker', 'GitHub Actions'] },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">关于我</h1>
        <PrintResumeButton />
      </div>

      <section className="prose dark:prose-invert">
        <p>
          你好，我是 {siteConfig.author.name}
          。我喜欢构建快速、可维护、对用户与搜索引擎都友好的产品体验。
        </p>
        <p>
          想要一份可打印的完整履历？前往{' '}
          <a className="underline" href="/resume">
            /resume
          </a>
          。
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">履历时间线</h2>
        <ol className="relative border-l pl-4">
          {timeline.map((t) => (
            <li key={t.time} className="mb-6 ml-2">
              <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
              <time className="text-sm text-muted-foreground">{t.time}</time>
              <div className="font-medium">{t.title}</div>
              <div className="text-sm text-muted-foreground">{t.detail}</div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">技能矩阵</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {skills.map((g) => (
            <div key={g.name} className="rounded-lg border p-4">
              <div className="mb-2 font-medium">{g.name}</div>
              <div className="flex flex-wrap gap-2">
                {g.items.map((i) => (
                  <span
                    key={i}
                    className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="prose dark:prose-invert">
        <h2>下载简历</h2>
        <p>点击右上角“打印 / 保存为 PDF”按钮，使用浏览器打印为 PDF，即可获得一份排版整齐的简历。</p>
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

import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { PrintResumeButton } from '@/components/site/print-resume'
import { JsonLd } from '@/components/site/json-ld'

export const metadata: Metadata = {
  title: '简历',
  description: '个人履历与技能概览，可直接打印或保存为 PDF。',
  alternates: { canonical: `${siteConfig.url}/resume` },
}

export default function ResumePage() {
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.author.name,
    url: siteConfig.author.url,
    sameAs: [siteConfig.social.github, siteConfig.social.twitter].filter(Boolean),
    email: siteConfig.social.email,
    jobTitle: 'Software Engineer',
  }

  const experiences = [
    { company: siteConfig.shortName, role: '全栈工程师 / 技术负责人', period: '2024 - 至今', bullets: [
      '负责 Next.js 平台与组件系统建设，推动性能优化与工程效率提升',
      '实践 Edge / ISR / RSC，沉淀稳定的内容工作流与 SEO 方案',
    ] },
    { company: '某互联网公司', role: '前端工程师', period: '2022 - 2024', bullets: [
      '主导设计系统与可访问性规范，Lighthouse > 95',
      '建设 E2E/单测/CI 流水线，降低回归风险',
    ] },
  ]

  const education = [
    { school: '某大学', degree: '计算机科学', period: '2018 - 2022' },
  ]

  const skills = [
    { name: 'Web / Framework', items: ['Next.js', 'React', 'Node.js', 'Vite'] },
    { name: 'Language', items: ['TypeScript', 'JavaScript', 'SQL'] },
    { name: 'Infra', items: ['Vercel', 'Cloudflare', 'Docker', 'GitHub Actions'] },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{siteConfig.author.name}</h1>
          <div className="text-sm text-muted-foreground">
            <a className="underline" href={siteConfig.social.github} target="_blank" rel="noreferrer">GitHub</a>
            {` · `}
            <a className="underline" href={siteConfig.social.twitter} target="_blank" rel="noreferrer">Twitter</a>
            {siteConfig.social.email ? (
              <>
                {` · `}
                <a className="underline" href={`mailto:${siteConfig.social.email}`}>{siteConfig.social.email}</a>
              </>
            ) : null}
          </div>
        </div>
        <div className="no-print">
          <PrintResumeButton />
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-xl font-semibold">概述</h2>
        <p className="text-sm text-muted-foreground">专注于 Web 平台与工程效率的全栈工程师，擅长 Next.js / TypeScript / 边缘计算与内容平台，重视可访问性与 SEO。</p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">经历</h2>
        <div className="space-y-4">
          {experiences.map((e) => (
            <div key={e.company} className="rounded-lg border p-4">
              <div className="flex items-baseline justify-between">
                <div className="font-medium">{e.company} · {e.role}</div>
                <div className="text-xs text-muted-foreground">{e.period}</div>
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">教育</h2>
        <ul className="list-disc pl-5 text-sm text-muted-foreground">
          {education.map((ed) => (
            <li key={ed.school}>{ed.school} · {ed.degree}（{ed.period}）</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">技能</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {skills.map((g) => (
            <div key={g.name} className="rounded-lg border p-4">
              <div className="mb-2 font-medium">{g.name}</div>
              <div className="flex flex-wrap gap-2">
                {g.items.map((i) => (
                  <span key={i} className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">{i}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <JsonLd data={person} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: siteConfig.url },
            { '@type': 'ListItem', position: 2, name: '简历', item: `${siteConfig.url}/resume` },
          ],
        }}
      />
    </div>
  )
}

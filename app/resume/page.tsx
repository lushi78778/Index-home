import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { PrintResumeButton } from '@/components/site/print-resume'
import { getAllProjects } from '@/lib/content'
import { JsonLd } from '@/components/site/json-ld'

export const metadata: Metadata = {
  title: 'Resume',
  description: 'Profile, experience and skills. Printable version available.',
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
    {
      company: siteConfig.shortName,
      role: 'Full‑stack Engineer / Tech Lead',
      period: '2024 – Present',
      bullets: [
        'Own the Next.js platform and component system; drive performance and DX improvements',
        'Practice Edge / ISR / RSC for content workflows with solid SEO',
      ],
    },
  ]

  const education = [
    {
      school: 'Science background (non-CS major)',
      degree: 'Self‑taught in CS topics',
      period: 'Ongoing',
    },
  ]

  // Derive a compact skills list from projects (tech + tags)
  const projects = getAllProjects()
  const countMap = new Map<string, number>()
  for (const p of projects) {
    p.tech?.forEach((t) => countMap.set(t, (countMap.get(t) || 0) + 1))
    p.tags?.forEach((t) => countMap.set(t, (countMap.get(t) || 0) + 1))
  }
  const topSkills = Array.from(countMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{siteConfig.author.name}</h1>
          <div className="text-sm text-muted-foreground">
            {[
              siteConfig.social?.github && (
                <a
                  key="gh"
                  className="underline"
                  href={siteConfig.social.github}
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              ),
              siteConfig.social?.twitter && (
                <a
                  key="tw"
                  className="underline"
                  href={siteConfig.social.twitter}
                  target="_blank"
                  rel="noreferrer"
                >
                  Twitter
                </a>
              ),
              siteConfig.social?.email && (
                <a key="mail" className="underline" href={`mailto:${siteConfig.social.email}`}>
                  {siteConfig.social.email}
                </a>
              ),
            ]
              .filter(Boolean)
              .map((el, idx, arr) => (
                <span key={idx}>
                  {el}
                  {idx < arr.length - 1 ? ' · ' : ''}
                </span>
              ))}
          </div>
        </div>
        <div className="no-print">
          <PrintResumeButton />
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Summary</h2>
        <p className="text-sm text-muted-foreground">
          Science background, self‑taught into web development. Focused on Next.js & TypeScript,
          performance, accessibility and maintainability. I leverage AI for productivity while
          keeping a solid understanding of the fundamentals.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Experience</h2>
        <div className="space-y-4">
          {experiences.map((e) => (
            <div key={`${e.company}-${e.period}`} className="rounded-lg border p-4">
              <div className="flex items-baseline justify-between">
                <div className="font-medium">
                  {e.company} · {e.role}
                </div>
                <div className="text-xs text-muted-foreground">{e.period}</div>
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                {e.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Education</h2>
        <ul className="list-disc pl-5 text-sm text-muted-foreground">
          {education.map((ed) => (
            <li key={ed.school}>
              {ed.school} · {ed.degree} ({ed.period})
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Skills</h2>
        {topSkills.length === 0 ? (
          <div className="text-sm text-muted-foreground">No data yet. Add some projects.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topSkills.map((s) => (
              <span
                key={s.name}
                className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                title={`Occurrences: ${s.count}`}
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
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.url },
            { '@type': 'ListItem', position: 2, name: 'Resume', item: `${siteConfig.url}/resume` },
          ],
        }}
      />
    </div>
  )
}

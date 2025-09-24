import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts, getAllProjects } from '@/lib/content'
import { siteConfig } from '@/config/site'

export function generateStaticParams() {
  const tags = new Set<string>()
  getAllPosts().forEach((p) => p.tags.forEach((t) => tags.add(t)))
  getAllProjects().forEach((p) => p.tags.forEach((t) => tags.add(t)))
  return Array.from(tags).map((t) => ({ tag: t }))
}

export async function generateMetadata({ params }: { params: { tag: string } }): Promise<Metadata> {
  const title = `标签：${params.tag}`
  const url = `${siteConfig.url}/tags/${encodeURIComponent(params.tag)}`
  return {
    title,
    alternates: { canonical: url },
    openGraph: { title, url },
    twitter: { title },
  }
}

export default function TagPage({ params }: { params: { tag: string } }) {
  const posts = getAllPosts().filter((p) => p.tags.includes(params.tag))
  const projects = getAllProjects().filter((p) => p.tags.includes(params.tag))
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">标签：{params.tag}</h1>
      <section>
        <h2 className="font-semibold">文章</h2>
        <ul className="list-disc pl-5">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link className="underline" href={`/blog/${p.slug}`}>
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-semibold">项目</h2>
        <ul className="list-disc pl-5">
          {projects.map((p) => (
            <li key={p.slug}>
              <Link className="underline" href={`/projects/${p.slug}`}>
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllTags } from '@/lib/content'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: '标签',
  description: '标签索引与计数。',
  alternates: { canonical: `${siteConfig.url}/tags` },
}

// 标签索引页：列出所有标签与计数
export default function TagsIndexPage() {
  const tags = getAllTags()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">标签</h1>
      <ul className="flex flex-wrap gap-3">
        {tags.map((t) => (
          <li key={t.tag}>
            <Link
              className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
              href={`/tags/${encodeURIComponent(t.tag)}` as any}
            >
              #{t.tag} <span className="text-muted-foreground">({t.count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

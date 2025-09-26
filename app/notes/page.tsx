import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { getAllNotes } from '@/lib/content'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Notes',
  description: '短笔记与书签聚合（可选）。',
  alternates: { canonical: `${siteConfig.url}/notes` },
}

export default function NotesPage({ searchParams }: { searchParams: { kind?: 'note' | 'bookmark'; tag?: string } }) {
  const all = getAllNotes()
  const kind = (searchParams.kind === 'note' || searchParams.kind === 'bookmark') ? searchParams.kind : undefined
  const tag = searchParams.tag?.trim()
  let notes = all
  if (kind) notes = notes.filter((n) => n.kind === kind)
  if (tag) notes = notes.filter((n) => n.tags?.includes(tag))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notes / Bookmarks</h1>
      <div className="text-sm text-muted-foreground">{kind ? (kind === 'note' ? '仅显示笔记' : '仅显示书签') : '全部类型'}</div>

      {/* 过滤器 */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link className={`rounded border px-2 py-1 ${!kind ? 'bg-accent' : ''}`} href="/notes">全部</Link>
        <Link className={`rounded border px-2 py-1 ${kind === 'note' ? 'bg-accent' : ''}`} href="/notes?kind=note">笔记</Link>
        <Link className={`rounded border px-2 py-1 ${kind === 'bookmark' ? 'bg-accent' : ''}`} href="/notes?kind=bookmark">书签</Link>
      </div>

      {/* 列表 */}
      <ul className="space-y-4">
        {notes.map((n) => (
          <li key={n.slug} className="rounded-lg border p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-lg font-medium">
                {n.kind === 'bookmark' && n.url ? (
                  <a className="underline" href={n.url} target="_blank" rel="noreferrer">
                    {n.title}
                  </a>
                ) : (
                  <span>{n.title}</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{new Date(n.date).toLocaleDateString()}</div>
            </div>
            {(n.summary) && <p className="mt-1 text-sm text-muted-foreground">{n.summary}</p>}
            {n.tags?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {n.tags.map((t) => (
                  <Link key={t} className="no-underline" href={`/notes?${new URLSearchParams({ ...(kind ? { kind } : {}), tag: t }).toString()}`}>
                    <Badge variant="secondary">#{t}</Badge>
                  </Link>
                ))}
              </div>
            ) : null}
          </li>
        ))}
        {notes.length === 0 && (
          <li className="text-sm text-muted-foreground">暂无内容。</li>
        )}
      </ul>
    </div>
  )
}

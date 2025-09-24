import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: 'Notes',
  description: '短笔记与书签聚合（可选）。',
  alternates: { canonical: `${siteConfig.url}/notes` },
}

export default function NotesPage() {
  return (
    <div className="prose dark:prose-invert">
      <h1>Notes / Bookmarks</h1>
      <p>短笔记与书签聚合（可选，后续填充）。</p>
    </div>
  )
}

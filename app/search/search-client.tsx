"use client"

import MiniSearch from 'minisearch'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type Doc = { id: string; title: string; slug: string; type: 'post' | 'project'; excerpt?: string; tags?: string[] }

export function SearchClient() {
  const sp = useSearchParams()
  const [query, setQuery] = useState('')
  const [docs, setDocs] = useState<Doc[]>([])
  const mini = useMemo(
    () =>
      new MiniSearch<Doc>({
        fields: ['title', 'excerpt', 'tags'],
        storeFields: ['title', 'slug', 'type', 'excerpt'],
        searchOptions: { prefix: true, fuzzy: 0.2 },
      }),
    [],
  )

  useEffect(() => {
    fetch('/api/search-index')
      .then((r) => r.json())
      .then((data: Doc[]) => {
        setDocs(data)
        mini.addAll(data)
      })
  }, [mini])

  useEffect(() => {
    const q = sp.get('q') || ''
    setQuery(q)
  }, [sp])

  const results = query ? mini.search(query).map((r) => r as any as Doc & { id: string }) : docs

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">搜索</h1>
      <input
        className="w-full max-w-xl rounded-md border px-3 py-2"
        placeholder="搜索文章或项目…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="space-y-2">
        {results.map((d) => (
          <li key={d.id}>
            <Link className="underline" href={`/${d.type === 'post' ? 'blog' : 'projects'}/${d.slug}`}>
              {d.title}
            </Link>
            {d.excerpt && <span className="text-muted-foreground"> · {d.excerpt}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

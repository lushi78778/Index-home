"use client"

import MiniSearch from 'minisearch'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Doc = { id: string; title: string; slug: string; type: 'post' | 'project'; excerpt?: string; snippet?: string; content?: string; tags?: string[] }

export function SearchClient() {
  const sp = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [docs, setDocs] = useState<Doc[]>([])
  const [active, setActive] = useState(0)
  const mini = useMemo(
    () =>
      new MiniSearch<Doc>({
        fields: ['title', 'excerpt', 'snippet', 'content', 'tags'],
        storeFields: ['title', 'slug', 'type', 'excerpt', 'snippet', 'content'],
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
    setActive(0)
  }, [sp])

  const results = query ? mini.search(query).map((r) => r as any as Doc & { id: string }) : docs

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => Math.min((results.length ? results.length - 1 : 0), i + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => Math.max(0, i - 1))
      } else if (e.key === 'Enter') {
        const d = results[active]
        if (d) {
          router.push(`/${d.type === 'post' ? 'blog' : 'projects'}/${d.slug}` as any)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [results, active, router])

  function highlight(text: string) {
    const q = query.trim()
    if (!q) return text
    try {
      const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig')
      return (
        <>
          {text.split(re).map((part, i) =>
            re.test(part) ? (
              <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 text-foreground">{part}</mark>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </>
      )
    } catch {
      return text
    }
  }

  function buildSnippet(d: Doc): string | undefined {
    // 优先使用 excerpt，其次使用 content/snippet 生成命中窗口
    if (d.excerpt) return d.excerpt
    const text = d.content || d.snippet
    if (!text) return undefined
    const q = query.trim()
    if (!q) return d.snippet || text.slice(0, 160)
    const lower = text.toLowerCase()
    const idx = lower.indexOf(q.toLowerCase())
    if (idx === -1) return d.snippet || text.slice(0, 160)
    const window = 120
    const start = Math.max(0, idx - window / 2)
    const end = Math.min(text.length, idx + q.length + window / 2)
    const prefix = start > 0 ? '…' : ''
    const suffix = end < text.length ? '…' : ''
    return `${prefix}${text.slice(start, end).trim()}${suffix}`
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">搜索</h1>
      <input
        className="w-full max-w-xl rounded-md border px-3 py-2"
        placeholder="搜索文章或项目…"
        value={query}
        onChange={(e) => {
          const q = e.target.value
          setQuery(q)
          const params = new URLSearchParams(Array.from(sp.entries()))
          if (q) params.set('q', q)
          else params.delete('q')
          router.replace(`/search?${params.toString()}`)
        }}
      />
      <div className="text-xs text-muted-foreground">↑/↓ 选择 · Enter 跳转</div>
      <ul className="space-y-2">
        {results.map((d, i) => (
          <li key={d.id}>
            <Link
              className={`underline ${i === active ? 'bg-accent' : ''}`}
              href={`/${d.type === 'post' ? 'blog' : 'projects'}/${d.slug}`}
            >
              {highlight(d.title) as any}
            </Link>
            {buildSnippet(d) && (
              <span className="text-muted-foreground"> · {highlight(buildSnippet(d)!) as any}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

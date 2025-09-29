'use client'

/**
 * @file 搜索页客户端组件
 * @description 支持本地静态索引与语雀搜索的联合结果，提供键盘导航与高亮。
 */

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { buildSnippet, createMiniSearch, getHighlightSegments, type SearchDoc } from '@/lib/search'
import { formatDateTime } from '@/lib/datetime'

type YuqueSearchItem = {
  id: number
  type: string
  title: string
  summary?: string
  url?: string
  book?: { namespace?: string }
  doc?: { slug?: string }
  updated_at?: string
}

export function SearchClient() {
  const sp = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [docs, setDocs] = useState<SearchDoc[]>([])
  const [active, setActive] = useState(0)
  const mini = useMemo(() => createMiniSearch(), [])

  // 复用同一份静态索引，避免客户端重复计算（作为 Yuque 搜索的兜底）
  useEffect(() => {
    fetch('/api/search-index')
      .then((r) => r.json())
      .then((data: SearchDoc[]) => {
        setDocs(data)
        mini.addAll(data)
      })
  }, [mini])

  useEffect(() => {
    const q = sp.get('q') || ''
    setQuery(q)
    setActive(0)
  }, [sp])

  const [yuqueItems, setYuqueItems] = useState<YuqueSearchItem[] | null>(null)

  useEffect(() => {
    let aborted = false
    const q = query.trim()
    if (!q) {
      setYuqueItems(null)
      return
    }
    fetch(`/api/yuque-search?q=${encodeURIComponent(q)}&limit=50`)
      .then((r) => r.json())
      .then((json) => {
        if (aborted) return
        const arr = Array.isArray(json?.data) ? (json.data as YuqueSearchItem[]) : []
        setYuqueItems(arr)
      })
      .catch(() => setYuqueItems(null))
    return () => {
      aborted = true
    }
  }, [query])

  const results: SearchDoc[] = (() => {
    const q = query.trim()
    if (!q) return docs
    if (yuqueItems && yuqueItems.length) {
      // 将 Yuque 结果映射为本地统一结构
      return yuqueItems.map((it) => {
        const ns = it.book?.namespace || ''
        const slug = it.doc?.slug || (it.url ? it.url.split('/').filter(Boolean).slice(-1)[0] : '')
        return {
          id: String(it.id),
          title: it.title,
          slug: ns && slug ? `${ns}/${slug}` : slug,
          type: 'post' as const,
          snippet: it.summary || '',
          namespace: ns || undefined,
          updatedAt: it.updated_at || undefined,
        }
      })
    }
    // 兜底：使用本地 MiniSearch
    return mini.search(q).map((hit) => hit as unknown as SearchDoc)
  })()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => Math.min(results.length ? results.length - 1 : 0, i + 1))
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

  // 借助统一的工具函数生成高亮片段，避免与命令面板实现不一致
  const renderHighlight = (text: string) =>
    getHighlightSegments(text, query).map((segment, index) =>
      segment.matched ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-700 text-foreground">
          {segment.text}
        </mark>
      ) : (
        <span key={index}>{segment.text}</span>
      ),
    )

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
        {results.map((d, i) => {
          const snippet = buildSnippet(d, query)
          return (
            <li key={d.id}>
              <Link
                className={`underline ${i === active ? 'bg-accent' : ''}`}
                href={`/${d.type === 'post' ? 'blog' : 'projects'}/${d.slug}` as any}
              >
                {renderHighlight(d.title) as any}
              </Link>
              {(() => {
                const meta: string[] = []
                if (d.namespace) meta.push(d.namespace)
                if (d.createdAt) meta.push(`发布 ${formatDateTime(d.createdAt)}`)
                if (typeof d.wordCount === 'number') meta.push(`${d.wordCount} 字`)
                return (
                  <span className="text-muted-foreground">
                    {meta.length > 0 ? meta.join(' · ') : null}
                    {snippet ? (
                      <>
                        {meta.length > 0 ? ' · ' : ''}
                        {renderHighlight(snippet) as any}
                      </>
                    ) : null}
                  </span>
                )
              })()}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

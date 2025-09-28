'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
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

type Ctx = {
  open: () => void
  close: () => void
}

const CommandCtx = createContext<Ctx | null>(null)

export function useCommand() {
  const ctx = useContext(CommandCtx)
  if (!ctx) throw new Error('useCommand must be used within CommandProvider')
  return ctx
}

export function CommandProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations()
  const [visible, setVisible] = useState(false)
  const [query, setQuery] = useState('')
  const [docs, setDocs] = useState<SearchDoc[]>([])
  const [active, setActive] = useState(0)
  const mini = useMemo(() => createMiniSearch(), [])

  // 拉取构建期生成的静态索引文件，一次性灌入 MiniSearch
  useEffect(() => {
    fetch('/api/search-index')
      .then((r) => r.json())
      .then((data: SearchDoc[]) => {
        setDocs(data)
        mini.addAll(data)
      })
      .catch(() => {})
  }, [mini])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes('mac')
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setVisible((v) => !v)
      }
      if (e.key === 'Escape') setVisible(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const { open, close } = useMemo<Ctx>(
    () => ({ open: () => setVisible(true), close: () => setVisible(false) }),
    [],
  )

  const [yuqueItems, setYuqueItems] = useState<YuqueSearchItem[] | null>(null)

  useEffect(() => {
    let aborted = false
    const q = query.trim()
    if (!q) {
      setYuqueItems(null)
      return
    }
    fetch(`/api/yuque-search?q=${encodeURIComponent(q)}&limit=20`)
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
    if (!q) return docs.slice(0, 10)
    if (yuqueItems && yuqueItems.length) {
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
    return mini.search(q).map((hit) => hit as unknown as SearchDoc)
  })()

  // keyboard navigation for results
  useEffect(() => {
    if (!visible) return
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
          const href = `/${d.type === 'post' ? 'blog' : 'projects'}/${d.slug}`
          location.href = href
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, results, active])

  useEffect(() => {
    setActive(0)
  }, [query])

  // 统一的高亮渲染逻辑，维持搜索页与命令面板的视觉一致性
  const renderHighlight = useCallback(
    (text: string) =>
      getHighlightSegments(text, query).map((segment, index) =>
        segment.matched ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-700 text-foreground">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      ),
    [query],
  )

  return (
    <CommandCtx.Provider value={{ open, close }}>
      {children}
      {visible && (
        <div className="fixed inset-0 z-[70] bg-black/40" onClick={close}>
          <div
            className="mx-auto mt-24 w-full max-w-2xl rounded-lg border bg-background p-2 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="命令面板"
          >
            <div className="flex items-center gap-2 border-b px-2 py-1">
              <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}+K
              </kbd>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="h-10 w-full bg-transparent px-2 outline-none"
                aria-label="搜索"
              />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                ↑/↓ 选择 · Enter 跳转 · Esc 关闭
              </span>
            </div>
            <ul className="max-h-80 overflow-auto p-1">
              {results.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">无结果</li>
              ) : (
                results.slice(0, 20).map((d, i) => {
                  const snippet = buildSnippet(d, query)
                  return (
                    <li key={d.id}>
                      <Link
                        href={`/${d.type === 'post' ? 'blog' : 'projects'}/${d.slug}` as any}
                        className={`block rounded px-3 py-2 hover:bg-accent ${i === active ? 'bg-accent' : ''}`}
                        onClick={close}
                      >
                        <div className="font-medium">{renderHighlight(d.title) as any}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {(() => {
                            const metaParts: string[] = []
                            if (d.namespace) metaParts.push(d.namespace)
                            if (d.createdAt) metaParts.push(`发布 ${formatDateTime(d.createdAt)}`)
                            if (d.updatedAt && d.updatedAt !== d.createdAt)
                              metaParts.push(`更新 ${formatDateTime(d.updatedAt)}`)
                            if (typeof d.wordCount === 'number') metaParts.push(`${d.wordCount} 字`)
                            if (typeof d.hits === 'number') metaParts.push(`${d.hits} 次浏览`)
                            const metaText = metaParts.join(' · ')
                            return (
                              <>
                                {metaText}
                                {snippet ? (
                                  <>
                                    {metaText ? ' · ' : ''}
                                    {renderHighlight(snippet) as any}
                                  </>
                                ) : null}
                              </>
                            )
                          })()}
                        </div>
                      </Link>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        </div>
      )}
    </CommandCtx.Provider>
  )
}

"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import MiniSearch from 'minisearch'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

type Doc = { id: string; title: string; slug: string; type: 'post' | 'project'; excerpt?: string; tags?: string[] }

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

  const { open, close } = useMemo<Ctx>(() => ({ open: () => setVisible(true), close: () => setVisible(false) }), [])

  const results = query ? (mini.search(query).map((r) => r as any as Doc & { id: string })) : docs.slice(0, 10)

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
          >
            <div className="flex items-center gap-2 border-b px-2 py-1">
              <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}+K</kbd>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="h-10 w-full bg-transparent px-2 outline-none"
                aria-label="搜索"
              />
            </div>
            <ul className="max-h-80 overflow-auto p-1">
              {results.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">无结果</li>
              ) : (
                results.slice(0, 20).map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/${d.type === 'post' ? 'blog' : 'projects'}/${d.slug}`}
                      className="block rounded px-3 py-2 hover:bg-accent"
                      onClick={close}
                    >
                      <div className="font-medium">{d.title}</div>
                      {d.excerpt && <div className="text-xs text-muted-foreground line-clamp-2">{d.excerpt}</div>}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </CommandCtx.Provider>
  )
}

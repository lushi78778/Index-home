'use client'

/**
 * @file 命令面板（全局搜索）提供者
 * @description 提供 Ctrl/⌘+K 唤起的命令面板，包括：
 * - 加载静态搜索索引（/api/search-index）并构建 MiniSearch
 * - 联合 Meilisearch 搜索（/api/search）
 * - 高亮、摘要生成与键盘导航（↑/↓/Enter/Esc）
 */

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
  // Yuque 元信息（namespace->repo中文名, login->group中文名）
  const [repoNameMap, setRepoNameMap] = useState<Map<string, string>>(new Map())
  const [groupNameMap, setGroupNameMap] = useState<Map<string, string>>(new Map())

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

  // 拉取 Yuque 元信息（仓库/小组中文名）
  useEffect(() => {
    fetch('/api/yuque/meta')
      .then((r) => r.json())
      .then((json) => {
        const rMap = new Map<string, string>()
        const gMap = new Map<string, string>()
        for (const r of Array.isArray(json?.repos) ? json.repos : []) {
          if (r?.namespace && r?.name) rMap.set(r.namespace, r.name)
        }
        for (const g of Array.isArray(json?.groups) ? json.groups : []) {
          if (g?.login && g?.name) gMap.set(g.login, g.name)
        }
        setRepoNameMap(rMap)
        setGroupNameMap(gMap)
      })
      .catch(() => {})
  }, [])

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
    fetch(`/api/search?q=${encodeURIComponent(q)}&limit=20`)
      .then((r) => r.json())
      .then((json) => {
        if (aborted) return
        const arr = Array.isArray(json?.data) ? json.data : []
        const mapped: YuqueSearchItem[] = arr.map((h: any) => ({
          id: h.id,
          type: h.type === 'project' ? 'Project' : 'Doc',
          title: h.title,
          book: h.namespace ? { namespace: h.namespace } : undefined,
          doc: h.slug ? { slug: h.type === 'post' ? h.slug.split('/').slice(-1)[0] : h.slug } : undefined,
          updated_at: h.updatedAt,
          url: h.type === 'post' ? `/blog/${h.slug}` : `/projects/${h.slug}`,
          summary: h.excerpt,
        }))
        setYuqueItems(mapped)
      })
      .catch(() => setYuqueItems(null))
    return () => {
      aborted = true
    }
  }, [query])

  // 组装分组结果与拍平列表
  const groupedResults = (() => {
    const q = query.trim()
    if (!q) return { yuque: [] as SearchDoc[], projects: docs.filter((d) => d.type === 'project').slice(0, 10) }
    // 1) 语雀全文搜索结果（post）
    const yuqueDocs: SearchDoc[] = (yuqueItems || []).map((it) => {
      const ns = it.book?.namespace || ''
      const slug = it.doc?.slug || (it.url ? it.url.split('/').filter(Boolean).slice(-1)[0] : '')
      return {
        id: `yuque:${it.id}`,
        title: it.title,
        slug: ns && slug ? `${ns}/${slug}` : slug,
        type: 'post' as const,
        snippet: it.summary || '',
        namespace: ns || undefined,
        updatedAt: it.updated_at || undefined,
      }
    })
    // 2) 本地 MiniSearch（仅聚合 projects）
    const localHits = mini.search(q).map((hit) => hit as unknown as SearchDoc)
    const localProjects = localHits.filter((d) => d.type === 'project')
    return { yuque: yuqueDocs.slice(0, 10), projects: localProjects.slice(0, 10) }
  })()
  const flatResults: SearchDoc[] = [...groupedResults.yuque, ...groupedResults.projects]

  // 处理结果列表的键盘导航逻辑
  useEffect(() => {
    if (!visible) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => Math.min(flatResults.length ? flatResults.length - 1 : 0, i + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => Math.max(0, i - 1))
      } else if (e.key === 'Enter') {
        const d = flatResults[active]
        if (d) {
          const href = `/${d.type === 'post' ? 'blog' : 'projects'}/${d.slug}`
          location.href = href
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, flatResults, active])

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
            <ul className="max-h-80 overflow-auto p-1 space-y-2">
              {flatResults.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">无结果</li>
              ) : (
                <>
                  {groupedResults.yuque.length > 0 && (
                    <li className="px-2 py-1 text-xs text-muted-foreground sticky top-0 bg-background z-10">语雀（{groupedResults.yuque.length}）</li>
                  )}
                  {groupedResults.yuque.map((d, i) => {
                    const snippet = d.snippet || ''
                    const idx = i
                    const ns = d.namespace || ''
                    const [lg, repo] = ns ? ns.split('/') : ['', '']
                    const groupName = lg ? groupNameMap.get(lg) || lg : ''
                    const repoName = ns ? repoNameMap.get(ns) || repo : ''
                    return (
                      <li key={d.id}>
                        <Link
                          href={`/${d.type === 'post' ? 'blog' : 'projects'}/${d.slug}` as any}
                          className={`block rounded px-3 py-2 hover:bg-accent ${idx === active ? 'bg-accent' : ''}`}
                          onClick={close}
                        >
                          <div className="font-medium">{renderHighlight(d.title) as any}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {(() => {
                              const meta: string[] = []
                              if (groupName) meta.push(groupName)
                              if (repoName) meta.push(repoName)
                              if (d.updatedAt) meta.push(`更新 ${formatDateTime(d.updatedAt)}`)
                              const text = meta.join(' · ')
                              return (
                                <>
                                  {text}
                                  {snippet ? (
                                    <>
                                      {text ? ' · ' : ''}
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
                  })}
                  {groupedResults.projects.length > 0 && (
                    <li className="px-2 py-1 text-xs text-muted-foreground sticky top-0 bg-background z-10">项目（{groupedResults.projects.length}）</li>
                  )}
                  {groupedResults.projects.map((d, j) => {
                    const snippet = buildSnippet(d, query)
                    const idx = groupedResults.yuque.length + j
                    return (
                      <li key={d.id}>
                        <Link
                          href={`/${d.type === 'post' ? 'blog' : 'projects'}/${d.slug}` as any}
                          className={`block rounded px-3 py-2 hover:bg-accent ${idx === active ? 'bg-accent' : ''}`}
                          onClick={close}
                        >
                          <div className="font-medium">{renderHighlight(d.title) as any}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {(() => {
                              const meta: string[] = []
                              if (Array.isArray(d.tags) && d.tags.length) meta.push(`#${d.tags.slice(0, 3).join(' #')}`)
                              if (d.createdAt) meta.push(`发布 ${formatDateTime(d.createdAt)}`)
                              const text = meta.join(' · ')
                              return (
                                <>
                                  {text}
                                  {snippet ? (
                                    <>
                                      {text ? ' · ' : ''}
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
                  })}
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </CommandCtx.Provider>
  )
}

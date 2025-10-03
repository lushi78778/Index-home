'use client'

/**
 * @file 搜索页客户端组件
 * @description 已切换为服务端 Meilisearch 统一搜索；本地静态索引仅用于项目在空查询时的展示。
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
  // Yuque 元信息
  const [repoNameMap, setRepoNameMap] = useState<Map<string, string>>(new Map())
  const [groupNameMap, setGroupNameMap] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  }, [])

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
    setLoading(true)
    setError(null)
    // 切换到 Meilisearch（/api/search）
    fetch(`/api/search?q=${encodeURIComponent(q)}&limit=50`)
      .then((r) => r.json())
      .then((json) => {
        if (aborted) return
        // Meili hits 与原 YuqueSearchItem 字段不同，这里做最小映射
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
        setLoading(false)
      })
      .catch((e) => {
        setYuqueItems(null)
        setError(e?.message || '搜索失败')
        setLoading(false)
      })
    return () => {
      aborted = true
    }
  }, [query])

  // 分组结果
  const grouped = (() => {
    const q = query.trim()
    if (!q) return { yuque: [] as SearchDoc[], projects: docs.filter((d) => d.type === 'project') }
    const yuqueDocs: SearchDoc[] = (yuqueItems || []).map((it) => {
      const ns = it.book?.namespace || ''
      const slug = it.doc?.slug || (it.url ? it.url.split('/').filter(Boolean).slice(-1)[0] : '')
      return {
        id: `yuque:${it.id}`,
        title: it.title,
        slug: it.type === 'Project' ? slug : ns && slug ? `${ns}/${slug}` : slug,
        type: it.type === 'Project' ? 'project' : ('post' as const),
        snippet: it.summary || it.url ? '' : '',
        namespace: ns || undefined,
        updatedAt: it.updated_at || undefined,
      }
    })
    // Meili 结果已经包含项目与文章，这里不再叠加本地 MiniSearch
    const projects = yuqueDocs.filter((d) => d.type === 'project')
    const posts = yuqueDocs.filter((d) => d.type === 'post')
    return { yuque: posts, projects }
  })()
  const flat = [...grouped.yuque, ...grouped.projects]

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => Math.min(flat.length ? flat.length - 1 : 0, i + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => Math.max(0, i - 1))
      } else if (e.key === 'Enter') {
        const d = flat[active]
        if (d) {
          router.push(`/${d.type === 'post' ? 'blog' : 'projects'}/${d.slug}` as any)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flat, active, router])

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
          router.replace(`/search?${params.toString()}` as any)
        }}
      />
      <div className="text-xs text-muted-foreground">↑/↓ 选择 · Enter 跳转</div>
      {loading && <div className="text-sm text-muted-foreground">搜索中…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          {grouped.yuque.length > 0 && (
            <section>
              <h2 className="text-sm text-muted-foreground">语雀（{grouped.yuque.length}）</h2>
              <ul className="space-y-2 mt-1">
                {grouped.yuque.map((d, i) => {
                  const snippet = d.snippet || ''
                  const ns = d.namespace || ''
                  const [lg, repo] = ns ? ns.split('/') : ['', '']
                  const groupName = lg ? groupNameMap.get(lg) || lg : ''
                  const repoName = ns ? repoNameMap.get(ns) || repo : ''
                  return (
                    <li key={d.id}>
                      <Link
                        className={`underline ${i === active ? 'bg-accent' : ''}`}
                        href={`/blog/${d.slug}` as any}
                      >
                        {renderHighlight(d.title) as any}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {[
                          groupName && repoName ? `${groupName} · ${repoName}` : d.namespace,
                          d.updatedAt && `更新 ${formatDateTime(d.updatedAt)}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                        {snippet ? (
                          <>
                            {' · '}
                            {renderHighlight(snippet) as any}
                          </>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
          {grouped.projects.length > 0 && (
            <section>
              <h2 className="text-sm text-muted-foreground">项目（{grouped.projects.length}）</h2>
              <ul className="space-y-2 mt-1">
                {grouped.projects.map((d, i) => {
                  const snippet = buildSnippet(d, query)
                  return (
                    <li key={d.id}>
                      <Link
                        className={`underline ${i === active ? 'bg-accent' : ''}`}
                        href={`/projects/${d.slug}` as any}
                      >
                        {renderHighlight(d.title) as any}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {[
                          Array.isArray(d.tags) && d.tags.length ? `#${d.tags.slice(0, 3).join(' #')}` : '',
                          d.createdAt && `发布 ${formatDateTime(d.createdAt)}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                        {snippet ? (
                          <>
                            {' · '}
                            {renderHighlight(snippet) as any}
                          </>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
          {grouped.yuque.length === 0 && grouped.projects.length === 0 && (
            <div className="text-sm text-muted-foreground">无结果</div>
          )}
        </div>
      )}
    </div>
  )
}

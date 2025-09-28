'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Home,
  List as ListIcon,
} from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'

// 轻量本地声明，避免从 server-only 模块引入运行时代码
export type TocNode = {
  uuid?: string
  parent_uuid?: string | null
  title?: string
  type?: string // 'DOC' | 'TITLE' | ...
  slug?: string
  url?: string
  children?: TocNode[]
}

function deriveSlug(n: TocNode): string | undefined {
  if (n.slug) return n.slug
  if (n.url) {
    const parts = n.url.split('/').filter(Boolean)
    return parts[parts.length - 1]
  }
  return undefined
}

function findPathToSlug(nodes: TocNode[], slug: string): string[] | null {
  const path: string[] = []
  const walk = (arr: TocNode[], stack: string[]): boolean => {
    for (const n of arr) {
      const id = n.uuid || n.title || ''
      const next = id ? [...stack, id] : stack
      const nSlug = deriveSlug(n)
      if (n.type === 'DOC' && nSlug === slug) {
        path.splice(0, path.length, ...next)
        return true
      }
      if (n.children && n.children.length) {
        if (walk(n.children, next)) return true
      }
    }
    return false
  }
  return walk(nodes, []) ? path : null
}

function filterTree(nodes: TocNode[], q: string): TocNode[] {
  if (!q) return nodes
  const low = q.toLowerCase()
  const walk = (arr: TocNode[]): TocNode[] => {
    const out: TocNode[] = []
    for (const n of arr) {
      const selfHit = (n.title || '').toLowerCase().includes(low)
      const kids = n.children ? walk(n.children) : []
      if (selfHit || kids.length) {
        out.push({ ...n, children: kids })
      }
    }
    return out
  }
  return walk(nodes)
}

export function RepoTocTreeClient({
  namespace,
  nodes,
  currentSlug,
  repoName,
  showTopBar = true,
}: {
  namespace: string
  nodes: TocNode[]
  currentSlug?: string
  repoName?: string
  showTopBar?: boolean
}) {
  const storageKey = `repo-toc:${namespace}`
  const [openSet, setOpenSet] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')

  // 初始：从本地恢复展开项，并确保当前文档的祖先默认展开
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      const restored = raw ? (JSON.parse(raw) as string[]) : []
      const s = new Set(restored)
      if (currentSlug) {
        const path = findPathToSlug(nodes, currentSlug)
        if (path) path.forEach((id) => s.add(id))
      }
      setOpenSet(s)
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace])

  // 持久化展开项
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(openSet)))
    } catch {}
  }, [openSet, storageKey])

  const filtered = useMemo(() => filterTree(nodes, query), [nodes, query])

  const toggle = (id: string) => {
    setOpenSet((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => {
    const allIds: string[] = []
    const collect = (arr: TocNode[]) => {
      for (const n of arr) {
        const id = n.uuid || n.title || ''
        if (id) allIds.push(id)
        if (n.children && n.children.length) collect(n.children)
      }
    }
    collect(filtered)
    setOpenSet(new Set(allIds))
  }

  const collapseAll = () => setOpenSet(new Set())

  return (
    <div className="text-sm">
      {showTopBar && (
        <div className="mb-2 flex flex-col gap-2 text-sm">
          {(() => {
            const itemClass =
              'flex w-full items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md border px-3 py-2 hover:bg-accent'
            return (
              <>
                {/* 返回/blog */}
                <Tooltip label="返回 博客">
                  <a href="/blog" className={itemClass}>
                    <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">返回博客</span>
                  </a>
                </Tooltip>

                {/* 知识库名称 */}
                <Tooltip label={repoName || namespace}>
                  <span className={`${itemClass} border-dashed text-foreground/90`}>
                    <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">{repoName || namespace}</span>
                  </span>
                </Tooltip>

                {/* 搜索框 */}
                <div>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="搜索"
                    className="h-10 w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-md border px-3 bg-background"
                    title="搜索此知识库"
                  />
                </div>

                {/* 首页（跳知识库索引） */}
                <Tooltip label="首页（知识库索引）">
                  <a href={`/blog/${namespace}`} className={itemClass}>
                    <Home className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">首页</span>
                  </a>
                </Tooltip>

                {/* 目录（同样跳索引，避免歧义；未来可切换为第一个分组锚点） */}
                <Tooltip label="目录（知识库索引）">
                  <a href={`/blog/${namespace}`} className={itemClass}>
                    <ListIcon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">目录</span>
                  </a>
                </Tooltip>
              </>
            )
          })()}
          {/* 全展/全收 按钮 */}
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="flex-1 rounded-md border px-3 py-2 text-center hover:bg-accent"
            >
              全展
            </button>
            <button
              onClick={collapseAll}
              className="flex-1 rounded-md border px-3 py-2 text-center hover:bg-accent"
            >
              全收
            </button>
          </div>
        </div>
      )}
      <NavTree
        nodes={filtered}
        namespace={namespace}
        currentSlug={currentSlug}
        openSet={openSet}
        toggle={toggle}
      />
    </div>
  )
}

function NavTree({
  nodes,
  namespace,
  currentSlug,
  openSet,
  toggle,
}: {
  nodes: TocNode[]
  namespace: string
  currentSlug?: string
  openSet: Set<string>
  toggle: (id: string) => void
}) {
  return (
    <ul className="space-y-1">
      {nodes.map((n) => {
        const id = n.uuid || n.title || ''
        const slug = deriveSlug(n)
        const hasChildren = !!(n.children && n.children.length)
        const isDocLike = n.type === 'DOC' || n.type === 'Mind' || (!!slug && !n.type)
        // 优先判断是否有子节点：有子节点时应当视作“分组”，而不是叶子文档
        if (!hasChildren && isDocLike && slug) {
          const isActive = currentSlug && slug === currentSlug
          return (
            <li key={id || slug}>
              <Link
                href={`/blog/${namespace}/${slug}` as any}
                className={`flex h-8 min-w-0 items-center rounded px-2 hover:bg-accent ${isActive ? 'bg-accent font-medium' : ''}`}
                title={n.title}
              >
                <span className="truncate">{n.title}</span>
              </Link>
            </li>
          )
        }
        // 分组/目录项
        const isOpen = id ? openSet.has(id) : true
        return (
          <li key={id || n.title}>
            <button
              type="button"
              className="flex h-8 w-full min-w-0 items-center gap-1 rounded px-2 text-muted-foreground hover:bg-accent"
              onClick={() => id && toggle(id)}
              title={n.title}
            >
              <span aria-hidden className="shrink-0">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
              <span className="truncate">{n.title}</span>
            </button>
            {isOpen && n.children && n.children.length > 0 && (
              <div className="ml-3 border-l pl-2">
                <NavTree
                  nodes={n.children}
                  namespace={namespace}
                  currentSlug={currentSlug}
                  openSet={openSet}
                  toggle={toggle}
                />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

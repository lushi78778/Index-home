'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/datetime'

type ToggleDetail = { action?: 'toggle' | 'open' | 'close' }

type CustomToggleEvent = CustomEvent<ToggleDetail>

type InlineDoc = {
  slug: string
  title: string
  createdAt?: string
  updatedAt?: string
  wordCount?: number
  hits?: number
  // 喜欢/评论已不再展示
}

export function InlineTocPanel({
  docs,
  namespace,
  repoName,
}: {
  docs: InlineDoc[]
  namespace: string
  repoName?: string
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomToggleEvent).detail || {}
      if (detail.action === 'open') setVisible(true)
      else if (detail.action === 'close') setVisible(false)
      else setVisible((prev) => !prev)
    }
    window.addEventListener('repo-inline-toc', handler as EventListener)
    return () => window.removeEventListener('repo-inline-toc', handler as EventListener)
  }, [])

  if (!visible || !docs.length) return null

  return (
    <div className="ml-auto mb-6 w-full max-w-3xl rounded-md border bg-background p-4 text-sm shadow-sm">
      <div className="mb-3 flex items-center justify-between font-medium">
        <span>{repoName || namespace} · 目录</span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
        >
          关闭
        </button>
      </div>
      <ul className="space-y-2">
        {docs.map((doc) => {
          const href = `/blog/${namespace}/${doc.slug}`
          const metaParts: string[] = []
          if (doc.createdAt) metaParts.push(`发布 ${formatDateTime(doc.createdAt)}`)
          if (typeof doc.wordCount === 'number') metaParts.push(`${doc.wordCount} 字`)
          // 喜欢/评论已在非正文区域移除展示

          return (
            <li key={doc.slug}>
              <Link
                href={href as any}
                className="block rounded-md border px-3 py-2 hover:bg-accent"
                onClick={() => setVisible(false)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="truncate font-medium">{doc.title || doc.slug}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {doc.createdAt ? formatDateTime(doc.createdAt) : ''}
                  </span>
                </div>
                {metaParts.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {metaParts.map((text) => (
                      <span key={text}>{text}</span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

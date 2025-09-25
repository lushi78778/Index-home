"use client"

import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCommand } from './command-provider'
import { Tooltip } from '@/components/ui/tooltip'
import { useEffect, useMemo, useState as useStateReact } from 'react'
import { useTranslations } from 'next-intl'

// 站点头部导航
export function Header() {
  const t = useTranslations()
  const [locale, setLocale] = useStateReact('zh')
  useEffect(() => {
    const v = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)?.[1]
    setLocale(v || 'zh')
  }, [])
  const prefix = `/${locale}`
  const nav = [
    { href: `${prefix}/`, label: t('nav.home') },
    { href: `${prefix}/blog`, label: t('nav.blog') },
    { href: `${prefix}/projects`, label: t('nav.projects') },
    { href: `${prefix}/about`, label: t('nav.about') },
    { href: `${prefix}/now`, label: t('nav.now') },
    { href: `${prefix}/uses`, label: t('nav.uses') },
  ]
  const router = useRouter()
  const [q, setQ] = useState('')
  const { open } = useCommand()
  function goSearch() {
    const s = q.trim()
  if (!s) return (router.push as any)(`${prefix}/search`)
  ;(router.push as any)(`${prefix}/search?q=${encodeURIComponent(s)}`)
  }
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href={`${prefix}/` as any} className="font-semibold">
          xray.top
        </Link>
        <nav className="hidden gap-4 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href as any} className="text-sm text-muted-foreground hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {/* 命令面板入口 */}
          <Tooltip label="全局搜索 (Ctrl/⌘+K)">
            <button onClick={open} className="h-8 rounded-md border px-2 text-sm hover:bg-accent">命令</button>
          </Tooltip>
          {/* 顶部全局搜索框 */}
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && goSearch()}
              placeholder={t('search.placeholder')}
              className="h-8 w-56 rounded-md border bg-background px-2 text-sm"
            />
            <button onClick={goSearch} className="h-8 rounded-md border px-2 text-sm hover:bg-accent">{t('nav.search')}</button>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

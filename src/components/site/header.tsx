"use client"

import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// 站点头部导航
export function Header() {
  const nav = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/projects', label: 'Projects' },
    { href: '/about', label: 'About' },
    { href: '/now', label: 'Now' },
    { href: '/uses', label: 'Uses' },
  ]
  const router = useRouter()
  const [q, setQ] = useState('')
  function goSearch() {
    const s = q.trim()
    if (!s) return router.push('/search')
    router.push(`/search?q=${encodeURIComponent(s)}`)
  }
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-semibold">
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
          {/* 顶部全局搜索框 */}
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && goSearch()}
              placeholder="搜索站内内容…"
              className="h-8 w-56 rounded-md border bg-background px-2 text-sm"
            />
            <button onClick={goSearch} className="h-8 rounded-md border px-2 text-sm hover:bg-accent">搜索</button>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

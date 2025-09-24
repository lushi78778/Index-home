"use client"

import { useEffect, useState } from 'react'

type Item = { id: string; text: string; level: number }

// 简易 TOC：运行于客户端，从已渲染的文章内 h2/h3 提取目录
export function Toc() {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('article h2, article h3')) as HTMLElement[]
    const its = nodes.map((el) => ({
      id: el.id,
      text: el.innerText,
      level: el.tagName === 'H2' ? 2 : 3,
    }))
    setItems(its)
  }, [])

  if (!items.length) return null
  return (
    <nav className="mb-6 rounded-md border p-3 text-sm">
      <div className="mb-2 font-medium">目录</div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.id} className={it.level === 3 ? 'pl-4' : ''}>
            <a className="underline" href={`#${it.id}`}>
              {it.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

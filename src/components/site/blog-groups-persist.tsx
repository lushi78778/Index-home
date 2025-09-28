'use client'

import { useEffect } from 'react'

type Props = {
  storageKey?: string
}

// 作用：
// 1) 读取 localStorage 中记录的展开的分组（namespace 列表），在首次渲染后恢复为 open
// 2) 监听所有 <details data-ns> 的 toggle 事件，实时把当前 open 的分组写回 localStorage
export default function BlogGroupsPersist({ storageKey = 'blog-open-groups' }: Props) {
  useEffect(() => {
    const key = storageKey

    // 读取并恢复
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]') as string[]
      const set = new Set(saved)
      document.querySelectorAll<HTMLDetailsElement>('details[data-ns]')?.forEach((el) => {
        const ns = el.getAttribute('data-ns') || ''
        if (set.has(ns)) el.open = true
      })
    } catch {}

    // 监听 toggle，保存当前 open 的集合
    const handler = () => {
      try {
        const opens: string[] = []
        document.querySelectorAll<HTMLDetailsElement>('details[data-ns]')?.forEach((el) => {
          if (el.open) {
            const ns = el.getAttribute('data-ns') || ''
            if (ns) opens.push(ns)
          }
        })
        localStorage.setItem(key, JSON.stringify(opens))
      } catch {}
    }

    const details = Array.from(
      document.querySelectorAll<HTMLDetailsElement>('details[data-ns]') || [],
    )
    details.forEach((d) => d.addEventListener('toggle', handler))
    // 初始化时也同步一次
    handler()
    return () => details.forEach((d) => d.removeEventListener('toggle', handler))
  }, [storageKey])

  return null
}

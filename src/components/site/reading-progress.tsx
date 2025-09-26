'use client'

import { useEffect, useState } from 'react'

// 阅读进度条（简易实现）
export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function onScroll() {
      const h = document.documentElement
      const scrollTop = h.scrollTop || document.body.scrollTop
      const height = h.scrollHeight - h.clientHeight
      const p = height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0
      setProgress(p)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent">
      <div
        className="h-full bg-primary transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

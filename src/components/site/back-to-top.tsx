'use client'

import { useEffect, useState } from 'react'

export function BackToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!show) return null
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 right-4 z-40 rounded-full border bg-background/80 p-2 text-sm shadow backdrop-blur hover:bg-background"
      aria-label="返回顶部"
    >
      ↑ 顶部
    </button>
  )
}

"use client"

import React, { useEffect, useRef, useState } from 'react'

export function GiscusComments() {
  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID
  const enabled = !!(repo && repoId && category && categoryId)
  const divRef = useRef<HTMLDivElement | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!enabled || !divRef.current || loaded) return
    const el = divRef.current
    const io = new IntersectionObserver((entries) => {
      const vis = entries.some((e) => e.isIntersecting)
      if (vis) {
        const s = document.createElement('script')
        s.src = 'https://giscus.app/client.js'
        s.async = true
        s.crossOrigin = 'anonymous'
        s.setAttribute('data-repo', repo!)
        s.setAttribute('data-repo-id', repoId!)
        s.setAttribute('data-category', category!)
        s.setAttribute('data-category-id', categoryId!)
        s.setAttribute('data-mapping', 'pathname')
        s.setAttribute('data-strict', '0')
        s.setAttribute('data-reactions-enabled', '1')
        s.setAttribute('data-emit-metadata', '0')
        s.setAttribute('data-input-position', 'bottom')
        s.setAttribute('data-theme', 'preferred_color_scheme')
        s.setAttribute('data-lang', 'zh-CN')
        el.appendChild(s)
        setLoaded(true)
        io.disconnect()
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [enabled, loaded])

  if (!enabled) return null
  return <section ref={divRef} className="mt-10" />
}

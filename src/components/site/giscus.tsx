'use client'

import React, { useEffect, useRef, useState } from 'react'

export function GiscusComments() {
  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID
  const enabled = !!(repo && repoId && category && categoryId)
  // 将脚本挂载到内层更宽的容器上，便于控制可视宽度
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
        // 使用自定义主题路由：基于官方 preferred_color_scheme 扩展宽度
        const themeUrl = `${location.origin}/giscus-theme.css?v=3`
        s.setAttribute('data-repo', repo!)
        s.setAttribute('data-repo-id', repoId!)
        s.setAttribute('data-category', category!)
        s.setAttribute('data-category-id', categoryId!)
        s.setAttribute('data-mapping', 'pathname')
        s.setAttribute('data-strict', '0')
        s.setAttribute('data-reactions-enabled', '1')
        s.setAttribute('data-emit-metadata', '0')
        s.setAttribute('data-input-position', 'bottom')
        s.setAttribute('data-theme', themeUrl)
        s.setAttribute('data-lang', 'zh-CN')
        el.appendChild(s)
        setLoaded(true)
        io.disconnect()
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [enabled, loaded, repo, repoId, category, categoryId])

  // 确保在 HMR 或首次加载后，iframe 内主题更新为我们的自定义 CSS（从而应用宽度覆盖）
  useEffect(() => {
    if (!enabled || !divRef.current) return
    const themeUrl = `${location.origin}/giscus-theme.css?v=3`

    let tried = 0
    const maxTries = 8
    const timer = setInterval(() => {
      tried += 1
      const iframe = divRef.current!.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          { giscus: { setConfig: { theme: themeUrl } } },
          'https://giscus.app',
        )
        clearInterval(timer)
      } else if (tried >= maxTries) {
        clearInterval(timer)
      }
    }, 400)

    return () => clearInterval(timer)
  }, [enabled])

  if (!enabled) return null
  return (
    <section className="mt-6 not-prose w-full" aria-label="文章评论">
      {/* 与正文保持相同的左右内边距，保证分隔线与内容边缘 100% 对齐 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 border-t pt-6">
        <div ref={divRef} className="w-full" />
      </div>
    </section>
  )
}

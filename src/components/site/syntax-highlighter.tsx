'use client'

import { useEffect } from 'react'
// 动态引入 PrismJS，避免在服务端阶段参与打包
import 'prismjs/themes/prism-tomorrow.css'

export function SyntaxHighlighter() {
  useEffect(() => {
    // 在浏览器端动态加载 Prism 及常用语言包
    ;(async () => {
      const Prism = (await import('prismjs')).default as any
      await Promise.all([
        import('prismjs/components/prism-markup'),
        import('prismjs/components/prism-css'),
        import('prismjs/components/prism-javascript'),
        import('prismjs/components/prism-typescript'),
        import('prismjs/components/prism-jsx'),
        import('prismjs/components/prism-tsx'),
        import('prismjs/components/prism-bash'),
        import('prismjs/components/prism-json'),
        import('prismjs/components/prism-yaml'),
        import('prismjs/components/prism-markdown'),
        import('prismjs/components/prism-go'),
      ])
      // 为未标注语言的代码块做一次轻量启发式识别
      const codeNodes = Array.from(document.querySelectorAll('pre > code')) as HTMLElement[]
      for (const code of codeNodes) {
        const hasLang = /(^|\s)language-/.test(code.className)
        if (!hasLang) {
          const src = code.textContent || ''
          let lang = ''
          if (/^\s*\{[\s\S]*\}\s*$/.test(src) || /"\w+"\s*:/.test(src)) lang = 'json'
          else if (/^\s*package\s+\w+/.test(src) || /\bimport\s+\(.+\)/s.test(src)) lang = 'go'
          else if (/^\s*\w+\s*:\s*.+/m.test(src) && /:\s/.test(src)) lang = 'yaml'
          else if (/^\s*#!/.test(src) || /^\s*(\$|\#)\s+/.test(src)) lang = 'bash'
          if (!lang) lang = 'javascript'
          code.classList.add(`language-${lang}`)
        }
        const pre = code.parentElement as HTMLElement | null
        // 将语言 class 同步到 <pre>，兼容部分主题选择器
        const m = code.className.match(/language-([a-z0-9]+)/i)
        if (m && pre) pre.classList.add(m[0])
        Prism.highlightElement(code)
        if (pre) Prism.highlightElement(pre)
      }
    })()
  }, [])
  return null
}

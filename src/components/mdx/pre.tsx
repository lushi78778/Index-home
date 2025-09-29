'use client'

/**
 * @file 代码块容器（带复制按钮）
 * @description 包装 <pre> 并提供复制代码到剪贴板的能力。
 */

import * as React from 'react'

export function Pre(props: React.HTMLAttributes<HTMLPreElement>) {
  const ref = React.useRef<HTMLPreElement>(null)
  async function copy() {
    const el = ref.current
    if (!el) return
    const code = el.querySelector('code')?.textContent || ''
    try {
      await navigator.clipboard.writeText(code)
    } catch {}
  }
  return (
    <div className="group relative">
      <pre ref={ref} {...props} />
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 hidden rounded-md border bg-background/80 px-2 py-1 text-xs group-hover:block"
        aria-label="复制代码"
      >
        复制
      </button>
    </div>
  )
}

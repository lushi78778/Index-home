"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'consent_notice_v1'

/**
 * 一个轻量的底部提示条，用于提醒用户关注 Cookie 与用户协议（合规与使用说明）。
 * - 非阻断式，默认“使用即同意”，此提示仅作告知；
 * - 用户点击“我知道了”后，将在 localStorage 记录并不再显示；
 * - 仅在客户端渲染，避免水合不一致问题。
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const ack = window.localStorage.getItem(STORAGE_KEY)
      setVisible(!ack)
    } catch {
      // 若 localStorage 不可用，则默认显示
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="使用与 Cookie 提示"
      className="fixed inset-x-2 bottom-2 z-50 rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur md:inset-x-auto md:left-1/2 md:w-[720px] md:-translate-x-1/2"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 text-sm text-muted-foreground">
          使用本站即表示您同意本站的 Cookie 使用与
          <Link href="/policies#cookies" className="underline ml-1">Cookie 与个人信息条款</Link>
          （详见<Link href="/policies" className="underline mx-1">《合规与使用说明》</Link>）。
          如不同意，请停止使用或在浏览器中屏蔽相关脚本/Cookie。
        </div>
        <button
          type="button"
          className="shrink-0 rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
          onClick={() => {
            try {
              if (typeof window !== 'undefined') {
                window.localStorage.setItem(STORAGE_KEY, '1')
              }
            } catch {}
            setVisible(false)
          }}
        >
          我知道了
        </button>
      </div>
    </div>
  )
}

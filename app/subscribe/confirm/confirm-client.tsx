'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ConfirmClient() {
  const search = useSearchParams()
  const token = search.get('token') || ''
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')

  useEffect(() => {
    let aborted = false
    async function run() {
      if (!token) {
        setStatus('error')
        return
      }
      try {
        const res = await fetch(`/api/newsletter/confirm?token=${encodeURIComponent(token)}`)
        if (!aborted) setStatus(res.ok ? 'ok' : 'error')
      } catch {
        if (!aborted) setStatus('error')
      }
    }
    run()
    return () => {
      aborted = true
    }
  }, [token])

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <h1 className="text-2xl font-semibold mb-4">订阅确认</h1>
      <div role="status" aria-live="polite" className="rounded-md border p-4">
        {status === 'idle' && <span>正在确认你的订阅，请稍候…</span>}
        {status === 'ok' && <span className="text-green-700">订阅已确认，感谢你的关注！</span>}
        {status === 'error' && (
          <span className="text-red-700">确认链接无效或已过期，请重新尝试订阅。</span>
        )}
      </div>
    </div>
  )
}

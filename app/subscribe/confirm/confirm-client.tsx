'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Status = 'loading' | 'success' | 'error'

export default function ConfirmClient() {
  const search = useSearchParams()
  const token = search.get('token') || ''
  const [status, setStatus] = useState<Status>('loading')
  const [detail, setDetail] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const isLoading = status === 'loading'

  // 根据返回错误码生成提示文案，便于用户理解下一步操作
  const errorMessage = useMemo(() => {
    if (detail === 'missing_token') return '缺少确认参数，请从邮件中的最新确认链接访问或重新订阅。'
    if (detail === 'invalid_or_expired') return '确认链接无效或已过期，请重新尝试订阅。'
    if (detail === 'upstream') return '订阅服务暂时不可用，请稍后再试。'
    return '确认链接无效或已过期，请稍后重试，或返回重新订阅。'
  }, [detail])

  useEffect(() => {
    let cancelled = false
    async function confirm() {
      if (!token) {
        if (!cancelled) {
          setStatus('error')
          setDetail('missing_token')
        }
        return
      }
      if (!cancelled) {
        setStatus('loading')
        setDetail(null)
      }
      try {
        const res = await fetch(`/api/newsletter/confirm?token=${encodeURIComponent(token)}`, {
          cache: 'no-store',
        })
        const payload = await res.json().catch(() => null)
        if (cancelled) return
        if (res.ok) {
          setStatus('success')
          return
        }
        setStatus('error')
        setDetail(payload?.error ?? null)
      } catch {
        if (!cancelled) {
          setStatus('error')
          setDetail(null)
        }
      }
    }
    confirm()
    return () => {
      cancelled = true
    }
  }, [token, attempt])

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <h1 className="text-3xl font-bold tracking-tight">订阅确认</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        双重确认可确保你确实拥有该邮箱，防止误订阅或垃圾邮件。
      </p>

      <div
        role="status"
        aria-live="polite"
        aria-busy={isLoading}
        className="mt-8 rounded-md border p-6"
      >
        {isLoading && (
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-foreground" aria-hidden />
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">正在确认你的订阅，请稍候…</span>
              <span>一旦完成，你将开始收到最新的内容更新。</span>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-2">
            <div className="text-lg font-semibold text-green-600">订阅已确认，感谢你的关注！</div>
            <p className="text-sm text-muted-foreground">
              你可以随时从邮件底部的取消订阅链接退出；也欢迎继续浏览博客或项目。
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-2">
            <div className="text-lg font-semibold text-red-600">确认失败</div>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-accent"
        >
          返回首页
        </Link>
        {status === 'success' && (
          <>
            <Link
              href="/blog"
              className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-accent"
            >
              阅读最新文章
            </Link>
            <Link
              href="/projects"
              className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-accent"
            >
              查看精选项目
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <Link
              href="/subscribe"
              className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-accent"
            >
              返回订阅页
            </Link>
            <Button
              type="button"
              size="sm"
              onClick={() => setAttempt((n) => n + 1)}
              disabled={isLoading}
            >
              重新尝试
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

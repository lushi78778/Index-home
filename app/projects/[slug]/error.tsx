'use client'

import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container mx-auto max-w-2xl py-12">
      <h1 className="text-2xl font-bold">页面加载失败</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        很抱歉，加载项目详情时遇到错误。你可以稍后重试，或返回项目列表。
      </p>
      {error?.digest && (
        <p className="mt-2 text-xs text-muted-foreground">Digest: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-accent"
        >
          重试
        </button>
        <Link
          href="/projects"
          className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-accent"
        >
          返回项目列表
        </Link>
      </div>
    </div>
  )
}

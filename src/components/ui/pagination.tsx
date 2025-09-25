import Link from 'next/link'

export function Pagination({
  current,
  total,
  basePath,
  buildHref,
}: {
  current: number
  total: number
  basePath?: string
  buildHref?: (page: number) => string
}) {
  const prev = Math.max(1, current - 1)
  const next = Math.min(total, current + 1)
  const href = (n: number) => (buildHref ? buildHref(n) : `${basePath || ''}?page=${n}`)
  return (
    <nav className="flex items-center justify-between" aria-label="分页导航">
      <Link
        aria-disabled={current <= 1}
        href={(current <= 1 ? '#' : href(prev)) as any}
        className="text-sm underline aria-disabled:pointer-events-none aria-disabled:opacity-50"
      >
        上一页
      </Link>
      <div className="text-sm text-muted-foreground">
        第 {current} / {Math.max(1, total)} 页
      </div>
      <Link
        aria-disabled={current >= total}
        href={(current >= total ? '#' : href(next)) as any}
        className="text-sm underline aria-disabled:pointer-events-none aria-disabled:opacity-50"
      >
        下一页
      </Link>
    </nav>
  )
}

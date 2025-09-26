import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-bold">页面未找到</h1>
      <p className="mt-2 text-sm text-muted-foreground">抱歉，你访问的页面不存在或已被移动。</p>
      <div className="mt-6 flex items-center justify-center gap-2">
        <Link href="/" className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">返回首页</Link>
        <Link href="/search" className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">去搜索</Link>
      </div>
    </div>
  )
}

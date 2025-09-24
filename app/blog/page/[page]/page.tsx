import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/content'
import { siteConfig } from '@/config/site'

export const revalidate = 60 * 10

export async function generateMetadata({ params }: { params: { page: string } }): Promise<Metadata> {
  const n = Math.max(1, Number(params.page || '1'))
  const title = n > 1 ? `博客 - 第 ${n} 页` : '博客'
  const url = `${siteConfig.url}/blog/page/${n}`
  return { title, alternates: { canonical: url }, openGraph: { title, url }, twitter: { title } }
}

export default function BlogPageByNumber({ params }: { params: { page: string } }) {
  const page = Math.max(1, Number(params.page || '1'))
  const pageSize = 10
  let posts = getAllPosts()

  const total = posts.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, totalPages)
  const start = (current - 1) * pageSize
  const pagePosts = posts.slice(start, start + pageSize)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">博客</h1>
      <div className="text-sm text-muted-foreground">共 {total} 篇文章</div>
      <ul className="space-y-4">
        {pagePosts.map((p) => (
          <li key={p.slug} className="rounded-lg border p-4">
            <Link className="text-lg font-medium underline" href={`/blog/${p.slug}` as any}>
              {p.title}
            </Link>
            <div className="mt-1 text-sm text-muted-foreground">
              {new Date(p.date).toLocaleDateString()} · {p.readingTime} 分钟
            </div>
            {p.excerpt && <p className="mt-2 text-sm">{p.excerpt}</p>}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <Link
          aria-disabled={current <= 1}
          href={(current <= 1 ? '#' : `/blog/page/${current - 1}`) as any}
          className="text-sm underline aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          上一页
        </Link>
        <div className="text-sm text-muted-foreground">第 {current} / {totalPages} 页</div>
        <Link
          aria-disabled={current >= totalPages}
          href={(current >= totalPages ? '#' : `/blog/page/${current + 1}`) as any}
          className="text-sm underline aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          下一页
        </Link>
      </div>
    </div>
  )
}

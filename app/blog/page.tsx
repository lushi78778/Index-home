import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/content'
import { siteConfig } from '@/config/site'
import { Pagination } from '@/components/ui/pagination'

export const metadata: Metadata = {
  title: '博客',
  description: '文章列表：分页、标签筛选、搜索入口。',
  alternates: { canonical: `${siteConfig.url}/blog` },
}

// 文章列表页
// - 支持分页：?page=1&pageSize=10
// - 支持标签筛选：?tag=xxx
// - 可扩展搜索：?q=关键词（当前示例未启用全文搜索）
export default function BlogIndex({
  searchParams,
}: {
  searchParams: { page?: string; pageSize?: string; tag?: string; q?: string }
}) {
  const page = Math.max(1, Number(searchParams.page || '1'))
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.pageSize || '10')))
  const tag = searchParams.tag?.trim()
  const q = searchParams.q?.trim().toLowerCase()

  // 获取文章集合，构建期读取，生产环境可配合 ISR
  let posts = getAllPosts()

  // 标签筛选
  if (tag) posts = posts.filter((p) => p.tags.includes(tag))

  // 关键词简易筛选（可替换为客户端索引或服务端搜索）
  if (q) posts = posts.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt?.toLowerCase().includes(q))

  const total = posts.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, totalPages)
  const start = (current - 1) * pageSize
  const pagePosts = posts.slice(start, start + pageSize)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">博客</h1>
      {/* 可选：当存在 q 等非规范筛选时，可考虑添加 robots noindex
      {q && <meta name="robots" content="noindex,follow" />} */}

      {/* 筛选提示 */}
      <div className="text-sm text-muted-foreground">
        {tag ? (
          <span>
            标签 <span className="font-medium">{tag}</span> · 共 {total} 篇
          </span>
        ) : (
          <span>共 {total} 篇文章</span>
        )}
      </div>

      {/* 列表 */}
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
            {p.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/blog?tag=${encodeURIComponent(t)}` as any}
                    className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:opacity-90"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* 分页 */}
      <Pagination
        current={current}
        total={totalPages}
        basePath="/blog"
        buildHref={(n) => `/blog?page=${n}${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`}
      />
    </div>
  )
}

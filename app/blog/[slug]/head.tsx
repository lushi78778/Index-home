import { getAllPosts, getPostBySlug } from '@/lib/content'

// 在 <head> 中输出分页前后关系（系列/上一/下一），利于 SEO 抓取器理解上下文
export default function Head({ params }: { params: { slug: string } }) {
  const posts = getAllPosts()
  const idx = posts.findIndex((p) => p.slug === params.slug)
  const post = idx >= 0 ? getPostBySlug(params.slug) : null
  if (!post) return null
  const prev = idx > 0 ? posts[idx - 1] : null
  const next = idx < posts.length - 1 ? posts[idx + 1] : null

  return (
    <>
      {prev ? <link rel="prev" href={`/blog/${prev.slug}`} /> : null}
      {next ? <link rel="next" href={`/blog/${next.slug}`} /> : null}
    </>
  )
}

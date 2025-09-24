import { NextResponse } from 'next/server'
import { getAllPosts, getAllProjects } from '@/lib/content'

export const revalidate = 3600 // 缓存 1 小时

// 构建静态搜索索引：title/slug/type/excerpt/tags
export async function GET() {
  const posts = getAllPosts().map((p) => ({
    id: `post:${p.slug}`,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    tags: p.tags,
    type: 'post' as const,
  }))
  const projects = getAllProjects().map((p) => ({
    id: `project:${p.slug}`,
    title: p.title,
    slug: p.slug,
    excerpt: p.description,
    tags: p.tags,
    type: 'project' as const,
  }))
  return NextResponse.json([...posts, ...projects])
}

import { NextResponse } from 'next/server'
import { getAllPosts, getAllProjects } from '@/lib/content'

export const revalidate = 3600 // 缓存 1 小时

function stripMarkdown(md?: string) {
  if (!md) return ''
  return md
    .replace(/```[\s\S]*?```/g, ' ') // code fences
    .replace(/`[^`]+`/g, ' ') // inline code
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // markdown links -> text
    .replace(/[#>*_~\-]+/g, ' ') // markdown tokens
    .replace(/<[^>]+>/g, ' ') // rudimentary HTML removal
    .replace(/\s+/g, ' ') // collapse spaces
    .trim()
}

// 构建静态搜索索引：title/slug/type/excerpt/snippet/content(纯文本,裁剪)/tags
export async function GET() {
  const posts = getAllPosts().map((p) => {
    const text = stripMarkdown(p.content)
    return {
      id: `post:${p.slug}`,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      snippet: text.slice(0, 200),
      content: text.slice(0, 1500), // 为命中窗口生成提供上下文，限制长度以控制体积
      tags: p.tags,
      type: 'post' as const,
    }
  })
  const projects = getAllProjects().map((p) => {
    const text = stripMarkdown(p.content)
    return {
      id: `project:${p.slug}`,
      title: p.title,
      slug: p.slug,
      excerpt: p.description,
      snippet: text.slice(0, 200),
      content: text.slice(0, 1500),
      tags: p.tags,
      type: 'project' as const,
    }
  })
  return NextResponse.json([...posts, ...projects])
}

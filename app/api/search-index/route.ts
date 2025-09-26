import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
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
export async function GET(req: Request) {
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
  const body = JSON.stringify([...posts, ...projects])
  const etag = 'W/"' + crypto.createHash('sha1').update(body).digest('hex') + '"'
  const ifNoneMatch = req.headers.get('if-none-match')
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  }
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ETag: etag,
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

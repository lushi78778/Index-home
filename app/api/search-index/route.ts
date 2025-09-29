/**
 * @file API: 生成站内搜索索引
 * @description 聚合语雀公开文档与本地项目，输出用于 MiniSearch 的轻量索引；
 * 使用 ETag 与 Cache-Control 做基础缓存，配合路由 revalidate 降低压力。
 */
import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { getAllProjects } from '@/lib/content'
import { listAllPublicDocs } from '@/lib/yuque'

export const revalidate = 3600 // 缓存 1 小时

// 粗粒度移除 Markdown/HTML 标记，仅保留纯文本用于索引/摘要
function stripMarkdown(md?: string) {
  if (!md) return ''
  return md
    .replace(/```[\s\S]*?```/g, ' ') // 去除代码块标记
    .replace(/`[^`]+`/g, ' ') // 去除行内代码反引号
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 链接语法仅保留可见文字
    .replace(/[#>*_~\-]+/g, ' ') // 过滤常见 Markdown 控制字符
    .replace(/<[^>]+>/g, ' ') // 简单移除 HTML 标签
    .replace(/\s+/g, ' ') // 折叠多余空白字符
    .trim()
}

// 构建静态搜索索引：title/slug/type/excerpt/snippet/content(纯文本,裁剪)/tags
export async function GET(req: Request) {
  const login = process.env.YUQUE_LOGIN || ''
  const includeDrafts = process.env.YUQUE_INCLUDE_DRAFTS === 'true'

  const postEntries = login
    ? (await listAllPublicDocs(login, { includeDrafts })).map((it) => {
        const text = `${it.doc.title} ${it.namespace}`
        return {
          id: `post:${it.namespace}/${it.doc.slug}`,
          title: it.doc.title,
          slug: `${it.namespace}/${it.doc.slug}`,
          excerpt: it.repo || it.namespace,
          snippet: text.slice(0, 200),
          content: text.slice(0, 1500),
          tags: [] as string[],
          type: 'post' as const,
          namespace: it.namespace,
          createdAt: it.doc.created_at,
          updatedAt: it.doc.updated_at,
          wordCount: typeof it.doc.word_count === 'number' ? it.doc.word_count : undefined,
          hits: typeof it.doc.hits === 'number' ? it.doc.hits : undefined,
        }
      })
    : []

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
      createdAt: p.date,
    }
  })
  const body = JSON.stringify([...postEntries, ...projects])
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

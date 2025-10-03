import { NextResponse } from 'next/server'
import { getAllProjects } from '@/lib/content'
import { listAllPublicDocs } from '@/lib/yuque'
import { getMeiliClient, type MeiliDoc } from '@/lib/meili'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  // 简单鉴权：支持 header: X-Index-Secret 或 ?secret= 与环境变量 INDEX_SECRET 对比
  const url = new URL(req.url)
  const provided = req.headers.get('x-index-secret') || url.searchParams.get('secret') || ''
  const expected = process.env.INDEX_SECRET || process.env.REVALIDATE_SECRET || ''
  if (!expected || provided !== expected) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const client = getMeiliClient()
  if (!client) return NextResponse.json({ ok: false, error: 'MEILI_NOT_CONFIGURED' }, { status: 500 })
  const index = client.index('search')

  const login = process.env.YUQUE_LOGIN || ''
  const includeDrafts = process.env.YUQUE_INCLUDE_DRAFTS === 'true'

  const posts: MeiliDoc[] = login
    ? (await listAllPublicDocs(login, { includeDrafts })).map((it) => ({
        id: `post_${it.namespace.replace(/[^a-zA-Z0-9_-]/g, '_')}_${String(it.doc.slug).replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        title: it.doc.title,
        slug: `${it.namespace}/${it.doc.slug}`,
        type: 'post',
        namespace: it.namespace,
        excerpt: `${it.namespace}`,
        content: `${it.doc.title} ${it.namespace}`,
        createdAt: it.doc.created_at,
        updatedAt: it.doc.updated_at,
      }))
    : []

  const projects: MeiliDoc[] = getAllProjects().map((p) => ({
    id: `project_${String(p.slug).replace(/[^a-zA-Z0-9_-]/g, '_')}`,
    title: p.title,
    slug: p.slug,
    type: 'project',
    excerpt: p.description,
    content: p.content,
    createdAt: p.date,
  }))

  // 创建索引并设置可搜索字段/排序权重
  await index.updateSettings({
    // 按优先级：标题 > 标签 > 摘要 > 正文
    searchableAttributes: ['title', 'tags', 'excerpt', 'content'],
    displayedAttributes: ['id', 'title', 'slug', 'type', 'namespace', 'excerpt', 'updatedAt', 'tags'],
    filterableAttributes: ['type', 'namespace', 'tags'],
    sortableAttributes: ['updatedAt'],
    rankingRules: [
      'words',
      'typo',
      'proximity',
      // 提升 title/tags 的匹配权重
      'attribute',
      'sort',
      'exactness',
    ],
    typoTolerance: {
      enabled: true,
      // 中文场景：保持默认字符阈值即可，英文/数字混排也能容错
      // 可按需调整：minWordSizeForTypos: { oneTypo: 5, twoTypos: 9 }
    } as any,
    synonyms: {
      '网络': ['网路', '网络', '网络技术', 'network'],
      '计算机': ['电脑', '计算机', 'computer'],
      '消息队列': ['MQ', 'MessageQueue', '消息中间件'],
      'RocketMQ': ['MQ', '消息队列'],
      'HTTP': ['超文本传输协议'],
      'GitHub': ['github', 'GH'],
      'Node.js': ['Node', 'nodejs', 'NodeJS'],
    },
  })

  const { taskUid } = await index.addDocuments([...posts, ...projects])
  return NextResponse.json({ ok: true, taskUid, counts: { posts: posts.length, projects: projects.length } })
}

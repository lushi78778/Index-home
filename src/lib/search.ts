/**
 * @file 站内搜索工具
 * @description 提供 MiniSearch 的统一构建与高亮/摘要工具，
 * 与 /api/search-index 的索引结构保持一致，确保前后端契约稳定。
 */
import MiniSearch from 'minisearch'

/**
 * 静态搜索索引中的文档结构。与 /api/search-index 返回值保持一致。
 */
export type SearchDoc = {
  id: string
  title: string
  slug: string
  type: 'post' | 'project'
  excerpt?: string
  snippet?: string
  content?: string
  tags?: string[]
  /** 可选：来源知识库的 namespace（如 login/repo），用于展示 Yuque 搜索结果的仓库名 */
  namespace?: string
  /** 可选：发布时间 ISO 字符串 */
  createdAt?: string
  /** 可选：更新时间 ISO 字符串，用于展示 Yuque 搜索结果的更新时间 */
  updatedAt?: string
  /** 可选：字数统计（语雀 word_count） */
  wordCount?: number
  /** 可选：浏览量（语雀 hits） */
  hits?: number
}

/**
 * 构建 MiniSearch 实例的工厂函数，集中管理字段与搜索选项。
 * 避免在多个组件中重复定义，确保参数一致。
 */
export function createMiniSearch() {
  return new MiniSearch<SearchDoc>({
    fields: ['title', 'tags', 'excerpt', 'snippet', 'content'],
    storeFields: [
      'title',
      'slug',
      'type',
      'excerpt',
      'snippet',
      'content',
      'tags',
      'namespace',
      'createdAt',
      'updatedAt',
      'wordCount',
      'hits',
    ],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: { title: 4, tags: 2, excerpt: 1.5, snippet: 1.2, content: 1 },
    },
  })
}

/**
 * 高亮文本片段的数据结构。
 */
export type HighlightSegment = {
  text: string
  matched: boolean
}

const ESCAPE_REGEXP = /[-\/\\^$*+?.()|[\]{}]/g

function escapeForRegExp(value: string) {
  return value.replace(ESCAPE_REGEXP, '\\$&')
}

/**
 * 根据查询词对文本进行分段，标记出需要高亮的部分。
 * 返回的数组直接用于渲染 `<mark>`，比在组件内自行拆分更可靠。
 */
export function getHighlightSegments(text: string, query: string): HighlightSegment[] {
  const q = query.trim()
  if (!q) return [{ text, matched: false }]
  try {
    const re = new RegExp(`(${escapeForRegExp(q)})`, 'ig')
    return text
      .split(re)
      .map<HighlightSegment>((part, index) => ({ text: part, matched: index % 2 === 1 }))
      .filter((segment) => segment.text.length > 0)
  } catch {
    return [{ text, matched: false }]
  }
}

/**
 * 按查询词生成命中片段：
 * - 优先返回 excerpt；
 * - 其次从 content/snippet 中截取一段带上下文的文本，并添加省略号；
 * - query 为空时返回默认摘要。
 */
export function buildSnippet(
  doc: SearchDoc,
  query: string,
  { window = 120, fallbackLength = 160 }: { window?: number; fallbackLength?: number } = {},
): string | undefined {
  if (doc.excerpt) return doc.excerpt
  const text = doc.content || doc.snippet
  if (!text) return undefined
  const q = query.trim()
  if (!q) return doc.snippet || text.slice(0, fallbackLength)
  const lower = text.toLowerCase()
  const idx = lower.indexOf(q.toLowerCase())
  if (idx === -1) return doc.snippet || text.slice(0, fallbackLength)
  const start = Math.max(0, Math.floor(idx - window / 2))
  const end = Math.min(text.length, Math.ceil(idx + q.length + window / 2))
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return `${prefix}${text.slice(start, end).trim()}${suffix}`
}

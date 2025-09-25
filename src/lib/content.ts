/**
 * @file 本地内容读取与解析模块
 * @description
 * 该模块负责从文件系统 (`/content` 目录) 读取、解析和校验本地的 Markdown/MDX 内容。
 * 它使用 `gray-matter` 提取 frontmatter，`zod` 进行数据模型校验，并实现了一个简单的
 * 基于文件修改时间的内存缓存，以提高性能。
 */

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'
import readingTime from 'reading-time'

// 定义内容文件的根目录
const CONTENT_DIR = path.join(process.cwd(), 'content')

// 自定义 Zod schema，用于处理日期字段。
// 它接受字符串或 Date 对象，并统一转换为 ISO 8601 格式的字符串。
const zDateString = z
  .union([z.string().datetime(), z.date()]) // 接受 ISO 字符串或 Date 对象
  .transform((v) => (typeof v === 'string' ? v : v.toISOString()))

// --- 内容模型定义 (Schemas) ---

/**
 * 文章 (Post) 的 Zod Schema
 * 定义了文章 frontmatter 的数据结构和校验规则。
 */
export const PostSchema = z.object({
  title: z.string({ required_error: '标题 (title) 是必填项' }),
  slug: z.string(), // slug 将从文件名自动生成，此处仅为类型定义
  date: zDateString, // 发布日期
  updated: zDateString.optional(), // 可选的更新日期
  excerpt: z.string().optional(), // 可选的文章摘要
  cover: z.string().optional(), // 可选的封面图片 URL
  tags: z.array(z.string()).default([]), // 标签数组
  readingTime: z.number().optional(), // 阅读时间（分钟），将自动计算
  draft: z.boolean().default(false), // 是否为草稿
  canonicalUrl: z.string().url().optional(), // 可选的规范链接，用于 SEO
  ogImage: z.string().optional(), // 可选的 Open Graph 图片 URL
  series: z.string().optional(), // 所属系列
  lang: z.string().default('zh'), // 内容语言
})

// 从 Zod Schema 推断出 TypeScript 类型，并添加 content 字段
export type Post = z.infer<typeof PostSchema> & { content: string }

/**
 * 项目 (Project) 的 Zod Schema
 */
export const ProjectSchema = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  cover: z.string().optional(),
  tech: z.array(z.string()).default([]), // 使用的技术栈
  role: z.string().optional(), // 在项目中的角色
  links: z
    .object({
      github: z.string().url().optional(),
      demo: z.string().url().optional(),
    })
    .default({}),
  date: zDateString,
  featured: z.boolean().default(false), // 是否为精选项目
  tags: z.array(z.string()).default([]),
})
export type Project = z.infer<typeof ProjectSchema> & { content?: string }

/**
 * 笔记/书签 (Note/Bookmark) 的 Zod Schema
 */
export const NoteSchema = z.object({
  title: z.string(),
  slug: z.string(),
  url: z.string().url().optional(), // 如果是书签，则有外部链接
  date: zDateString,
  tags: z.array(z.string()).default([]),
  summary: z.string().optional(),
  kind: z.enum(['note', 'bookmark']).default('note'), // 类型：笔记或书签
})
export type Note = z.infer<typeof NoteSchema> & { content?: string }

// --- 文件读取与解析工具 ---

/**
 * 读取指定内容子目录下的所有 .md/.mdx 文件路径。
 * @param dir - 相对于 `content` 目录的子目录名 (e.g., 'posts')。
 * @returns 返回文件绝对路径的数组。
 */
function readContentFiles(dir: string): string[] {
  const absolutePath = path.join(CONTENT_DIR, dir)
  if (!fs.existsSync(absolutePath)) return []
  return fs
    .readdirSync(absolutePath)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .map((f) => path.join(absolutePath, f))
}

/**
 * 获取目录下所有内容文件的路径及其最后修改时间。
 * @param dir - 内容子目录名。
 * @returns 返回包含文件路径和 mtimeMs 的对象数组。
 */
function listWithMtime(dir: string): FileMark[] {
  const files = readContentFiles(dir)
  return files.map((p) => ({ p, mtimeMs: fs.statSync(p).mtimeMs }))
}

/**
 * 解析单个 MDX 文件，校验 frontmatter，并返回元数据和内容。
 * @param filePath - 文件的绝对路径。
 * @param schema - 用于校验 frontmatter 的 Zod Schema。
 * @returns 返回包含 `meta` (校验后的元数据) 和 `content` (Markdown 正文) 的对象。
 * @throws 如果 Zod 校验失败，则抛出错误。
 */
function parseFile<T extends z.ZodTypeAny>(filePath: string, schema: T): { meta: z.infer<T>; content: string } {
  const rawContent = fs.readFileSync(filePath, 'utf8')
  const { data: frontmatter, content } = matter(rawContent)
  const slug = path.basename(filePath).replace(/\.(md|mdx)$/i, '')

  // 将 slug 和 frontmatter 合并，然后进行校验
  const combinedData = { slug, ...frontmatter }
  const parsed = schema.safeParse(combinedData)

  if (!parsed.success) {
    console.error('❌ 内容校验失败:', filePath)
    console.error(parsed.error.format())
    throw new Error(`Frontmatter 校验失败: ${filePath}`)
  }

  return { meta: parsed.data, content }
}

// --- 内存缓存实现 ---

type FileMark = { p: string; mtimeMs: number }
let postsCache: { files: FileMark[]; items: Post[] } | null = null
let projectsCache: { files: FileMark[]; items: Project[] } | null = null
let notesCache: { files: FileMark[]; items: Note[] } | null = null

/**
 * 比较两组文件标记是否完全相同。
 * 用于判断缓存是否需要更新。
 */
function areFileMarksEqual(a: FileMark[], b: FileMark[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].p !== b[i].p || a[i].mtimeMs !== b[i].mtimeMs) return false
  }
  return true
}

// --- 公共数据获取 API ---

/**
 * 获取所有文章。
 * @param {object} [options] - 选项。
 * @param {boolean} [options.includeDraft=isDev] - 是否包含草稿。开发环境默认包含。
 * @returns {Post[]} - 按日期降序排列的文章数组。
 */
export function getAllPosts({ includeDraft = process.env.NODE_ENV === 'development' } = {}): Post[] {
  const currentMarks = listWithMtime('posts')

  // 如果缓存不存在或文件已变更，则重新解析所有文章
  if (!postsCache || !areFileMarksEqual(postsCache.files, currentMarks)) {
    const posts = currentMarks.map(({ p: filePath }) => {
      const { meta, content } = parseFile(filePath, PostSchema)
      const rt = readingTime(content)
      // 自动计算并注入阅读时间
      return { ...meta, readingTime: Math.ceil(rt.minutes), content }
    })
    postsCache = { files: currentMarks, items: posts }
  }

  const allPosts = postsCache.items

  // 根据选项过滤草稿和未到发布日期的文章
  const filtered = includeDraft
    ? allPosts
    : allPosts.filter((p) => !p.draft && new Date(p.date).getTime() <= Date.now())

  return filtered.sort((a, b) => +new Date(b.date) - +new Date(a.date))
}

/**
 * 根据 slug 获取单篇文章。
 */
export function getPostBySlug(slug: string, opts?: { includeDraft?: boolean }): Post | null {
  const all = getAllPosts(opts)
  return all.find((p) => p.slug === slug) || null
}

/**
 * 获取所有项目。
 */
export function getAllProjects(): Project[] {
  const currentMarks = listWithMtime('projects')
  if (!projectsCache || !areFileMarksEqual(projectsCache.files, currentMarks)) {
    const items = currentMarks.map(({ p: filePath }) => {
      const { meta, content } = parseFile(filePath, ProjectSchema)
      return { ...meta, content }
    })
    projectsCache = { files: currentMarks, items }
  }
  return projectsCache.items.sort((a, b) => +new Date(b.date) - +new Date(a.date))
}

/**
 * 获取所有笔记/书签。
 */
export function getAllNotes(): Note[] {
  const currentMarks = listWithMtime('notes')
  if (!notesCache || !areFileMarksEqual(notesCache.files, currentMarks)) {
    const items = currentMarks.map(({ p: filePath }) => {
      const { meta, content } = parseFile(filePath, NoteSchema)
      return { ...meta, content }
    })
    notesCache = { files: currentMarks, items }
  }
  return notesCache.items.sort((a, b) => +new Date(b.date) - +new Date(a.date))
}

/**
 * 聚合所有文章和项目的标签，并计算每个标签下的内容数量。
 * @returns {{ tag: string; count: number }[]} - 按数量降序排列的标签数组。
 */
export function getAllTags() {
  const tagCount = new Map<string, number>()

  getAllPosts({ includeDraft: false }).forEach(p => {
    p.tags.forEach(t => tagCount.set(t, (tagCount.get(t) || 0) + 1))
  })

  getAllProjects().forEach(pj => {
    pj.tags.forEach(t => tagCount.set(t, (tagCount.get(t) || 0) + 1))
  })

  return Array.from(tagCount.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
}

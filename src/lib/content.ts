import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'
import readingTime from 'reading-time'

// 内容根目录
const CONTENT_DIR = path.join(process.cwd(), 'content')

// 工具：日期字段既可为字符串也可为 Date，统一转为 ISO 字符串
const zDateString = z
  .union([z.string(), z.date()])
  .transform((v) => (typeof v === 'string' ? v : v.toISOString()))

// Post 内容模型（对齐 action.txt 要求）
export const PostSchema = z.object({
  title: z.string(),
  slug: z.string(),
  date: zDateString, // ISO 字符串
  updated: zDateString.optional(),
  excerpt: z.string().optional(),
  cover: z.string().optional(),
  tags: z.array(z.string()).default([]),
  readingTime: z.number().optional(),
  draft: z.boolean().default(false),
  canonicalUrl: z.string().url().optional(),
  ogImage: z.string().optional(),
  series: z.string().optional(),
  lang: z.string().default('zh'),
})

export type Post = z.infer<typeof PostSchema> & { content: string }

// Project 内容模型
export const ProjectSchema = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  cover: z.string().optional(),
  tech: z.array(z.string()).default([]),
  role: z.string().optional(),
  links: z
    .object({ github: z.string().url().optional(), demo: z.string().url().optional() })
    .default({}),
  date: zDateString,
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
})
export type Project = z.infer<typeof ProjectSchema> & { content?: string }

// Note/Bookmark 内容模型
export const NoteSchema = z.object({
  title: z.string(),
  slug: z.string(),
  url: z.string().url().optional(),
  date: zDateString,
  tags: z.array(z.string()).default([]),
  summary: z.string().optional(),
  kind: z.enum(['note', 'bookmark']).default('note'),
})
export type Note = z.infer<typeof NoteSchema> & { content?: string }

// 工具：读取目录下所有 mdx/md 文件
function readContentFiles(dir: string) {
  const abs = path.join(CONTENT_DIR, dir)
  if (!fs.existsSync(abs)) return [] as string[]
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .map((f) => path.join(abs, f))
}

// 获取文件列表及其 mtime（用于简单变更检测，避免每次请求都全量解析）
function listWithMtime(dir: string) {
  const files = readContentFiles(dir)
  return files.map((p) => ({ p, mtimeMs: fs.statSync(p).mtimeMs }))
}

// 解析 Frontmatter + 内容，并做 Zod 校验
function parseFile<T extends z.ZodTypeAny>(filePath: string, schema: T) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  const slug = path.basename(filePath).replace(/\.(md|mdx)$/i, '')
  const base = { slug, ...data }
  const parsed = schema.safeParse(base)
  if (!parsed.success) {
    // 输出详细错误便于排查（构建期可见）
    console.error('内容校验失败:', filePath, parsed.error.format())
    throw new Error(`Invalid content frontmatter: ${filePath}`)
  }
  return { meta: parsed.data as z.infer<T>, content }
}

// 简易缓存：按目录缓存集合，并在文件新增/删除或 mtime 变化时失效
type FileMark = { p: string; mtimeMs: number }
let postsCache: { files: FileMark[]; items: Post[] } | null = null
let projectsCache: { files: FileMark[]; items: Project[] } | null = null
let notesCache: { files: FileMark[]; items: Note[] } | null = null

function isSameFileMarks(a: FileMark[], b: FileMark[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].p !== b[i].p || a[i].mtimeMs !== b[i].mtimeMs) return false
  }
  return true
}

// 获取所有文章（按照日期倒序，过滤 draft）
export function getAllPosts({ includeDraft = process.env.NODE_ENV === 'development' } = {}): Post[] {
  const marks = listWithMtime('posts')
  if (!postsCache || !isSameFileMarks(postsCache.files, marks)) {
    const posts = marks.map(({ p: fp }) => {
      const { meta, content } = parseFile(fp, PostSchema)
      const rt = readingTime(content)
      return { ...meta, readingTime: Math.ceil(rt.minutes), content }
    })
    postsCache = { files: marks, items: posts }
  }
  const posts = postsCache.items
  const filtered = includeDraft
    ? posts
    : posts.filter((p) => !p.draft && new Date(p.date).getTime() <= Date.now())
  return filtered.sort((a, b) => +new Date(b.date) - +new Date(a.date))
}

export function getPostBySlug(slug: string, opts?: { includeDraft?: boolean }): Post | null {
  const all = getAllPosts({ includeDraft: opts?.includeDraft })
  return all.find((p) => p.slug === slug) || null
}

// 项目集合
export function getAllProjects(): Project[] {
  const marks = listWithMtime('projects')
  if (!projectsCache || !isSameFileMarks(projectsCache.files, marks)) {
    const items = marks.map(({ p: fp }) => {
      const { meta, content } = parseFile(fp, ProjectSchema)
      return { ...meta, content }
    })
    projectsCache = { files: marks, items }
  }
  return projectsCache.items.sort((a, b) => +new Date(b.date) - +new Date(a.date))
}

// 笔记/书签集合
export function getAllNotes(): Note[] {
  const marks = listWithMtime('notes')
  if (!notesCache || !isSameFileMarks(notesCache.files, marks)) {
    const items = marks.map(({ p: fp }) => {
      const { meta, content } = parseFile(fp, NoteSchema)
      return { ...meta, content }
    })
    notesCache = { files: marks, items }
  }
  return notesCache.items.sort((a, b) => +new Date(b.date) - +new Date(a.date))
}

// 标签聚合（文章 + 项目）
export function getAllTags() {
  const tagCount = new Map<string, number>()
  for (const p of getAllPosts()) {
    for (const t of p.tags) tagCount.set(t, (tagCount.get(t) || 0) + 1)
  }
  for (const pj of getAllProjects()) {
    for (const t of pj.tags) tagCount.set(t, (tagCount.get(t) || 0) + 1)
  }
  return Array.from(tagCount.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
}

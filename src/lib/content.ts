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

// 定义内容文件的根目录
const CONTENT_DIR = path.join(process.cwd(), 'content')

// 自定义 Zod schema，用于处理日期字段。
// 它接受字符串或 Date 对象，并统一转换为 ISO 8601 格式的字符串。
const zDateString = z
  .union([z.string().datetime(), z.date()]) // 接受 ISO 字符串或 Date 对象
  .transform((v) => (typeof v === 'string' ? v : v.toISOString()))

// --- 内容模型定义 (Schemas) ---

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
// --- 文件读取与解析工具 ---

/**
 * 读取指定内容子目录下的所有 .md/.mdx 文件路径。
 * @param dir - 相对于 `content` 目录的子目录名 (e.g., 'posts')。
 * @returns 返回文件绝对路径的数组。
 */
function readContentFiles(dir: string): string[] {
  const absolutePath = path.join(CONTENT_DIR, dir)
  if (!fs.existsSync(absolutePath)) return []

  const files: string[] = []
  const walk = (current: string) => {
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }
      if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
        files.push(fullPath)
      }
    }
  }

  walk(absolutePath)
  return files
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
function parseFile<T extends z.ZodTypeAny>(
  filePath: string,
  schema: T,
): { meta: z.infer<T>; content: string } {
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
let projectsCache: { files: FileMark[]; items: Project[] } | null = null

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
 * 聚合所有文章和项目的标签，并计算每个标签下的内容数量。
 * @returns {{ tag: string; count: number }[]} - 按数量降序排列的标签数组。
 */
export function getAllTags() {
  const tagCount = new Map<string, number>()

  getAllProjects().forEach((pj) => {
    pj.tags.forEach((t) => tagCount.set(t, (tagCount.get(t) || 0) + 1))
  })

  return Array.from(tagCount.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
}

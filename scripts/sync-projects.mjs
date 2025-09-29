#!/usr/bin/env node
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const CONFIG_PATH = path.join(root, 'config.yaml')
const PROJECTS_DIR = path.join(root, 'content', 'projects')
// 将输出目录改为 content/projects 根目录
const OUTPUT_DIR = PROJECTS_DIR

function readConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
  return YAML.parse(raw)
}

function sanitizeSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

function removeUndefined(obj) {
  if (Array.isArray(obj)) return obj.map(removeUndefined).filter((v) => v !== undefined)
  if (obj && typeof obj === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(obj)) {
      const cleaned = removeUndefined(v)
      if (cleaned !== undefined && !(Array.isArray(cleaned) && cleaned.length === 0)) {
        out[k] = cleaned
      }
    }
    return out
  }
  return obj === undefined ? undefined : obj
}

async function fetchJSON(url, headers) {
  const res = await fetch(url, { headers })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GitHub API 请求失败: ${res.status} ${res.statusText}\n${body}`)
  }
  return res.json()
}

async function fetchReadme(owner, repo, headers) {
  const url = `https://api.github.com/repos/${owner}/${repo}/readme`
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(url, {
      headers: {
        ...headers,
        Accept: 'application/vnd.github+json',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) {
      console.warn(`⚠️ 读取 README 失败：${repo} (${res.status})`)
      return null
    }
    const data = await res.json()
    if (data.content && data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf8')
    }
    if (data.download_url) {
      const raw = await fetch(data.download_url)
      return raw.ok ? await raw.text() : null
    }
    return null
  } catch (err) {
    console.warn(`⚠️ 读取 README 超时或失败：${repo} (${err?.code || err?.name || 'unknown'})`)
    return null
  }
}

function sanitizeReadmeForMDX(md) {
  if (!md) return md
  let s = md
  // 1) 将 HTML 注释替换为 MDX/JSX 注释，避免 “Unexpected character `!` before name” 错误
  //    支持多行注释内容。
  s = s.replace(/<!--([\s\S]*?)-->/g, (_m, p1) => `{/*${p1}*/}`)
  // 2) 其他可按需补充的替换（比如可能的 DOCTYPE）。这里先保守处理。
  s = s.replace(/<!DOCTYPE[^>]*>/gi, '')
  // 3) 邮箱自动链接 <name@domain.com> -> [name@domain.com](mailto:name@domain.com)
  s = s.replace(
    /<([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})>/g,
    (_m, email) => `[${email}](mailto:${email})`,
  )
  // 4) 将 <br> 规范为自闭合 <br /> 并去除错误的 </br>
  s = s.replace(/<\s*br\s*>/gi, '<br />')
  s = s.replace(/<\s*br\s*\/>/gi, '<br />')
  s = s.replace(/<\s*\/\s*br\s*>/gi, '')
  // 5) 将 <img ...> 规范为自闭合 <img ... />
  s = s.replace(/<img\b([^>]*?)(?<!\/)>/gi, (_m, attrs) => `<img${attrs} />`)
  // 6) 将 HTML 列表转换为 Markdown 列表，减少未闭合 <li> 的兼容问题
  //    先处理一行内的 <li>...</li>
  s = s.replace(/\s*<li>\s*([\s\S]*?)\s*<\/li>\s*/gi, (_m, content) => `\n- ${content}\n`)
  //    再将裸 <li> 转成行首列表符号，并移除 </li>
  s = s.replace(/\s*<li>\s*/gi, '\n- ')
  s = s.replace(/\s*<\/li>\s*/gi, '\n')
  //    去掉 <ul>/<ol> 容器标签
  s = s.replace(/<\/?\s*ul\s*>/gi, '')
  s = s.replace(/<\/?\s*ol\s*>/gi, '')
  return s
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true })
}

function getToken(config) {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN
  const tokenFromConfig = config?.runtime?.env?.GITHUB_TOKEN
  return tokenFromConfig && tokenFromConfig.trim().length > 0 ? tokenFromConfig.trim() : null
}

async function main() {
  const config = readConfig()
  const github = config.github || {}
  const owner = github.owner
  if (!owner) {
    console.error('config.github.owner 未配置，无法同步 GitHub 项目。')
    process.exit(1)
  }

  const maxRepos = Number(github.maxRepos || 10)
  const include = new Set((github.include || []).map((s) => s.toLowerCase()))
  const exclude = new Set((github.exclude || []).map((s) => s.toLowerCase()))
  const topicFilter = new Set((github.topicFilter || []).map((s) => s.toLowerCase()))
  const featuredTopics = new Set((github.featuredTopics || []).map((s) => s.toLowerCase()))

  const token = getToken(config)
  const headers = {
    'User-Agent': 'index-home-sync-script',
    Accept: 'application/vnd.github+json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  console.log(`→ 拉取 GitHub 仓库：${owner}`)
  let page = 1
  const perPage = 100
  const repositories = []
  while (true) {
    const chunk = await fetchJSON(
      `https://api.github.com/users/${owner}/repos?per_page=${perPage}&page=${page}`,
      headers,
    )
    if (!Array.isArray(chunk) || chunk.length === 0) break
    repositories.push(...chunk)
    if (chunk.length < perPage) break
    page += 1
    if (page > 10) break // 安全上限（1000 个仓库）
  }

  let filtered = repositories.filter((repo) => !repo.archived && !repo.private && !repo.fork)
  if (include.size > 0) {
    filtered = filtered.filter((repo) => include.has(repo.name.toLowerCase()))
  }
  if (exclude.size > 0) {
    filtered = filtered.filter((repo) => !exclude.has(repo.name.toLowerCase()))
  }
  if (topicFilter.size > 0) {
    filtered = filtered.filter((repo) => {
      const topics = repo.topics || []
      return topics.some((topic) => topicFilter.has(topic.toLowerCase()))
    })
  }

  if (filtered.length === 0) {
    console.warn('⚠️ 未找到符合条件的仓库。')
  }

  filtered.sort((a, b) => {
    // 自定义排序：优先精选 topic，其次按 star 数、最近 push 时间
    const aFeatured = (a.topics || []).some((t) => featuredTopics.has(t.toLowerCase()))
    const bFeatured = (b.topics || []).some((t) => featuredTopics.has(t.toLowerCase()))
    if (aFeatured !== bFeatured) return aFeatured ? -1 : 1
    const starDiff = (b.stargazers_count || 0) - (a.stargazers_count || 0)
    if (starDiff !== 0) return starDiff
    return (
      new Date(b.pushed_at || b.updated_at || b.created_at).getTime() -
      new Date(a.pushed_at || a.updated_at || a.created_at).getTime()
    )
  })

  const selected = filtered.slice(0, maxRepos)
  await ensureDir(OUTPUT_DIR)

  const keptFiles = new Set()

  for (const repo of selected) {
    const slug = sanitizeSlug(repo.name)
    const fileName = `${slug}.mdx`
    const filePath = path.join(OUTPUT_DIR, fileName)

    const topics = (repo.topics || []).map((t) => t.trim()).filter(Boolean)
    const tech = topics.filter((t) => !t.startsWith('featured'))
    const isFeatured = topics.some((t) => featuredTopics.has(t.toLowerCase()))
    const readme = await fetchReadme(owner, repo.name, headers)

    const frontmatter = removeUndefined({
      title: repo.name,
      description: repo.description || '暂无描述',
      tech,
      links: {
        github: repo.html_url,
        demo: repo.homepage || undefined,
      },
      date: repo.pushed_at || repo.created_at,
      tags: topics,
      featured: isFeatured || undefined,
      role: undefined,
      // 额外标记：用于后续清理，仅脚本生成的文件才会被清理逻辑识别
      source: 'github',
    })

    const yaml = YAML.stringify(frontmatter).trimEnd()
    const note = `> ⚙️ 本条目由 scripts/sync-projects.mjs 自动生成，来源：${repo.html_url}`
    const marker = '{/* generated:github-sync */}'
    const body = readme ? `\n${sanitizeReadmeForMDX(readme.trim())}\n` : '\n_Readme 暂无内容。_\n'
    const content = `---\n${yaml}\n---\n\n${note}\n${marker}\n${body}`

    await fsp.writeFile(filePath, content, 'utf8')
    keptFiles.add(filePath)
    console.log(`✓ 更新项目：${repo.name}`)
  }

  // 仅清理“脚本生成”的文件，手写项目文件一律保留
  const existing = (await fsp.readdir(OUTPUT_DIR)).filter((f) => f.endsWith('.mdx'))
  for (const file of existing) {
    const full = path.join(OUTPUT_DIR, file)
    if (keptFiles.has(full)) continue
    try {
      const raw = await fsp.readFile(full, 'utf8')
      const isGenerated =
        /source:\s*['"]github['"]/i.test(raw) || raw.includes('{/* generated:github-sync */}')
      if (!isGenerated) continue
      await fsp.unlink(full)
      console.log(`- 移除过期项目：${file}`)
    } catch {
      // 忽略读取/删除失败，避免脚本中断
    }
  }

  console.log(`完成，共同步 ${keptFiles.size} 个仓库。`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

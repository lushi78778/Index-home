#!/usr/bin/env node
/**
 * 读取 config.yaml 并生成 src/config/site.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import yaml from 'yaml'

const root = process.cwd()
const yamlPath = path.join(root, 'config.yaml')
const outTs = path.join(root, 'src', 'config', 'site.ts')

function ensureDir(p) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
}

function loadYaml(file) {
  const raw = fs.readFileSync(file, 'utf8')
  return yaml.parse(raw)
}

function toTs(site) {
  // 保留现有结构，便于最小变更接入
  return `/**
 * 本文件由 scripts/config.mjs 自动生成，请勿手动修改。
 * 如需调整站点信息，请编辑根目录下的 config.yaml。
 */
export const siteConfig = ${JSON.stringify(site, null, 2)} as const
`
}

function main() {
  if (!fs.existsSync(yamlPath)) {
    console.error('未找到 config.yaml，请在项目根目录创建该文件')
    process.exit(1)
  }
  const data = loadYaml(yamlPath)
  const site = data.site || {}
  ensureDir(outTs)
  fs.writeFileSync(outTs, toTs(site), 'utf8')
  console.log(`生成配置: ${path.relative(root, outTs)}`)

  // 写入 .env.local（合并已有内容），优先使用 runtime.env 中的值
  const envOut = path.join(root, '.env.local')
  const runtime = data.runtime || {}
  const envCfg = Object.assign({}, runtime.env || {})
  // 单一来源强制写入，避免重复配置：
  // - NEXT_PUBLIC_SITE_URL ← site.url
  // - NEXT_PUBLIC_PLAUSIBLE_DOMAIN ← runtime.plausibleDomain
  // - REVALIDATE_SECRET ← runtime.revalidateSecret
  if (site.url) envCfg.NEXT_PUBLIC_SITE_URL = site.url
  if (runtime.plausibleDomain) envCfg.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = runtime.plausibleDomain
  if (runtime.revalidateSecret) envCfg.REVALIDATE_SECRET = runtime.revalidateSecret

  // 读取现有 .env.local，进行键级合并（以 config.yaml 为准覆盖同名键）
  let existing = {}
  if (fs.existsSync(envOut)) {
    const raw = fs.readFileSync(envOut, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#')) continue
      const idx = line.indexOf('=')
      if (idx > 0) {
        const k = line.slice(0, idx).trim()
        const v = line.slice(idx + 1)
        existing[k] = v
      }
    }
  }
  const merged = { ...existing, ...envCfg }
  const outLines = Object.entries(merged).map(([k, v]) => `${k}=${v}`)
  fs.writeFileSync(envOut, outLines.join('\n') + '\n', { encoding: 'utf8' })
  console.log(`更新运行时环境: ${path.relative(root, envOut)}`)

  // 轻量校验与提示（不阻断构建）
  const warn = []
  if (!merged.REVALIDATE_SECRET || merged.REVALIDATE_SECRET === 'dev-secret') warn.push('REVALIDATE_SECRET 未设置为生产安全值')
  // 如果存在相应路由/功能但密钥为空，给出提醒
  if (fs.existsSync(path.join(root, 'app', 'api', 'contact'))) {
    if (!merged.RESEND_API_KEY) warn.push('RESEND_API_KEY 为空，联系表单邮件可能无法发送')
    if (!merged.CONTACT_TO_EMAIL) warn.push('CONTACT_TO_EMAIL 为空，联系表单收件人未配置')
  }
  if (fs.existsSync(path.join(root, 'app', 'api', 'newsletter'))) {
    if (!merged.BUTTONDOWN_API_TOKEN) warn.push('BUTTONDOWN_API_TOKEN 为空，订阅/双重确认可能无法工作')
    if (!merged.NEWSLETTER_FROM) warn.push('NEWSLETTER_FROM 为空，订阅邮件发件人未配置')
  }
  if ((merged.UPSTASH_REDIS_REST_URL && !merged.UPSTASH_REDIS_REST_TOKEN) || (!merged.UPSTASH_REDIS_REST_URL && merged.UPSTASH_REDIS_REST_TOKEN)) {
    warn.push('Upstash Redis 配置不完整（URL/TOKEN 需同时配置）')
  }
  if (warn.length) {
    console.warn('\n配置检查提示:')
    for (const m of warn) console.warn(' - ' + m)
  }
}

main()

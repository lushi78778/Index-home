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

  // 可选：将 runtime 写入 .env.local，便于 Next 使用
  const envOut = path.join(root, '.env.local')
  const runtime = data.runtime || {}
  const lines = []
  if (runtime.plausibleDomain) lines.push(`NEXT_PUBLIC_PLAUSIBLE_DOMAIN=${runtime.plausibleDomain}`)
  if (lines.length) {
    fs.writeFileSync(envOut, lines.join('\n') + '\n', { encoding: 'utf8' })
    console.log(`更新运行时环境: ${path.relative(root, envOut)}`)
  }
}

main()

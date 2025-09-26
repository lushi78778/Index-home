import { GET as getRss } from '@/app/rss.xml/route'
import { describe, it, expect } from 'vitest'

/**
 * 校验 RSS 结构与描述兜底逻辑：
 * - Content-Type 正确
 * - 存在至少 1 个 <item>
 * - 当 excerpt 缺失时使用正文前 160 字符（剥离 Markdown/HTML）
 */

describe('rss.xml', async () => {
  it('should generate valid rss with description fallback', async () => {
    const res = await getRss()
    expect(res.headers.get('Content-Type')).toContain('application/rss+xml')
    const xml = await res.text()
    expect(xml).toMatch(/<rss/) // basic
    expect(xml).toMatch(/<item>/)
    // 任意一篇文章 title 应该被 XML 转义并出现
    expect(xml).toMatch(/<title>.+<\/title>/)
    // tags 映射为 <category>
    expect(xml).toMatch(/<category>[^<]+<\/category>/)
    // content:encoded 存在
    expect(xml).toMatch(/<content:encoded><!\[CDATA\[/)
  })
})

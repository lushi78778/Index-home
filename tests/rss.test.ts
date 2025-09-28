import { GET as getRss } from '@/app/rss.xml/route'
import { describe, it, expect } from 'vitest'

/**
 * 校验 RSS 基本结构：
 * - Content-Type 正确
 * - 存在 <rss> / <channel>
 * - 输出结构可解析（允许没有 <item>）
 */

describe('rss.xml', async () => {
  it('should generate valid rss skeleton', async () => {
    const res = await getRss()
    expect(res.headers.get('Content-Type')).toContain('application/rss+xml')
    const xml = await res.text()
    expect(xml).toMatch(/<rss/)
    expect(xml).toMatch(/<channel>/)
    // 如果存在 item，应包含基本字段
    if (/<item>/.test(xml)) {
      expect(xml).toMatch(/<content:encoded><!\[CDATA\[/)
    }
  })
})

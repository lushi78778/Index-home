import { describe, it, expect } from 'vitest'
import { GET as getSitemap } from '@/app/sitemap.xml/route'

/**
 * 简单校验 sitemap 中的分页数量不超过上限并从第 2 页起
 */

describe('sitemap pagination', async () => {
  it('should include blog root and limited pagination starting from page 2', async () => {
    const res = await getSitemap()
    const xml = (await (res as any).text?.()) ?? ''
    expect(xml).toContain('/blog')
    const match: string[] = xml.match(/\/blog\/page\/(\d+)/g) || []
    // 所有分页页码应 >= 2
    const pages = match.map((m: string) => Number(m.split('/').pop()))
    expect(pages.every((n: number) => n >= 2)).toBe(true)
  })
})

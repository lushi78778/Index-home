import { GET as getRobots } from '@/app/robots.txt/route'
import { describe, it, expect } from 'vitest'

/**
 * 简单校验 robots.txt 的输出头与包含 Sitemap。
 */

describe('robots.txt', async () => {
  it('should include sitemap and have correct content type', async () => {
    const res = await getRobots()
    expect(res.headers.get('Content-Type')).toContain('text/plain')
    const body = await res.text()
    expect(body).toMatch(/Sitemap: .*\/sitemap\.xml/)
  })
})

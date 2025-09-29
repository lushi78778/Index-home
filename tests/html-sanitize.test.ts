import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from '@/lib/html'

// 基本 XSS 过滤
describe('sanitizeHtml', () => {
  it('removes scripts and event handlers', () => {
    const dirty = `<img src=x onerror=alert(1)><script>alert(1)</script><a href="javascript:alert(1)">x</a>`
    const clean = sanitizeHtml(dirty)
    expect(clean).not.toContain('onerror')
    expect(clean).not.toContain('<script')
    expect(clean).not.toMatch(/javascript:\s*alert/i)
  })

  it('allows safe styles and blocks dangerous ones', () => {
    const dirty = `<p style="position:fixed; left:0; top:0; width:100%; color:#fff">x</p>`
    const clean = sanitizeHtml(dirty)
    // 允许 color，但不应保留 position:fixed
    expect(clean).toContain('color')
    expect(clean).not.toContain('position:fixed')
  })

  it('allows https iframe only', () => {
    const dirty = `<iframe src="http://example.com"></iframe><iframe src="https://example.com"></iframe>`
    const clean = sanitizeHtml(dirty)
    expect(clean).not.toContain('http://example.com')
    expect(clean).toContain('https://example.com')
  })

  it('blocks data: scheme in anchors', () => {
    const dirty = `<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">click</a>`
    const clean = sanitizeHtml(dirty)
    expect(clean).not.toMatch(/href=\"data:/i)
  })
})

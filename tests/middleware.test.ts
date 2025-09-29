import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '../src/test-helpers/middleware-adapter'

function makeReq(url = 'https://example.com/') {
  return new NextRequest(url, { headers: { 'accept-language': 'en-US,en;q=0.9,zh;q=0.8' } as any })
}

describe('middleware', () => {
  it('sets x-locale header and cookies', () => {
    const req = makeReq('https://example.com/')
    const res = middleware(req as any)
    expect(res.headers.get('x-locale')).toBeTruthy()
  // 对 Cookie 的设置通过响应 cookies API 暴露
    const setCookie = res.headers.get('set-cookie') || ''
    expect(setCookie.toLowerCase()).toContain('next_locale=')
  })

  it('injects CSP with nonce and other security headers', () => {
    const req = makeReq('https://example.com/')
    const res = middleware(req as any)
    const csp = res.headers.get('content-security-policy')
    expect(csp).toBeTruthy()
    const nonce = res.headers.get('x-nonce')
    expect(nonce).toBeTruthy()
    expect(csp).toContain(`'nonce-`)
    expect(res.headers.get('referrer-policy')).toBe('no-referrer')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })
})

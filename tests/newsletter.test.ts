import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { ResendMock, resetResendMock, sendMock } from './mocks/resend'

const redisStore = new Map<string, string>()

vi.mock('resend', () => ({
  Resend: ResendMock,
}))

vi.mock('@upstash/redis', () => {
  class MockRedis {
    constructor(public config: { url: string; token: string }) {}
    async get(key: string) {
      return redisStore.get(key) ?? null
    }
    async set(key: string, value: string, _: { ex?: number } = {}) {
      redisStore.set(key, value)
      return 'OK'
    }
    async del(key: string) {
      const existed = redisStore.delete(key)
      return existed ? 1 : 0
    }
  }
  return { Redis: MockRedis }
})

vi.mock('@upstash/ratelimit', () => {
  class MockRatelimit {
    static slidingWindow(limit: number, window: string) {
      return { limit, window }
    }
    constructor(_: { redis: any; limiter: any }) {}
    async limit(_key: string) {
      return {
        success: true,
        reset: Math.floor(Date.now() / 1000) + 60,
        limit: 6,
        remaining: 6,
      }
    }
  }
  return { Ratelimit: MockRatelimit }
})

const originalEnv = { ...process.env }
const originalFetch = global.fetch
const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()

let POST: (req: Request) => Promise<Response>
let CONFIRM: (req: Request) => Promise<Response>

beforeAll(async () => {
  ;(global as any).fetch = fetchMock
  const newsletter = await import('@/app/api/newsletter/route')
  POST = newsletter.POST
  const confirm = await import('@/app/api/newsletter/confirm/route')
  CONFIRM = confirm.GET
})

afterAll(() => {
  ;(global as any).fetch = originalFetch
  process.env = originalEnv
})

beforeEach(() => {
  fetchMock.mockReset()
  resetResendMock()
  redisStore.clear()
  process.env = { ...originalEnv }
})

function buildRequest(body: Record<string, any>) {
  return new Request('http://localhost/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/newsletter (Resend)', () => {
  it('returns 400 for invalid payload', async () => {
    const res = await POST(buildRequest({}))
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns ok when Resend env missing', async () => {
    delete process.env.RESEND_API_KEY
    delete process.env.RESEND_NEWSLETTER_AUDIENCE_ID
    const res = await POST(buildRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({ ok: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('adds contact directly when double opt-in disabled', async () => {
    process.env.RESEND_API_KEY = 'test'
    process.env.RESEND_NEWSLETTER_AUDIENCE_ID = 'aud-1'
    process.env.NEWSLETTER_DOUBLE_OPT_IN = 'false'
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      text: vi.fn().mockResolvedValue(''),
    } as any)

    const res = await POST(buildRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(String(url)).toBe('https://api.resend.com/audiences/aud-1/contacts')
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer test' })
    expect(init?.body && JSON.parse(init.body as string)).toMatchObject({
      email: 'user@example.com',
    })
  })

  it('propagates upstream error', async () => {
    process.env.RESEND_API_KEY = 'test'
    process.env.RESEND_NEWSLETTER_AUDIENCE_ID = 'aud-1'
    process.env.NEWSLETTER_DOUBLE_OPT_IN = 'false'
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      text: vi.fn().mockResolvedValue('{"error":"invalid"}'),
    } as any)

    const res = await POST(buildRequest({ email: 'fail@example.com' }))
    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json).toMatchObject({ ok: false, error: 'upstream' })
  })

  it('sends confirmation mail when double opt-in enabled', async () => {
    process.env.RESEND_API_KEY = 'test'
    process.env.RESEND_NEWSLETTER_AUDIENCE_ID = 'aud-1'
    process.env.NEWSLETTER_DOUBLE_OPT_IN = 'true'
    process.env.UPSTASH_REDIS_REST_URL = 'mock'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'mock'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'

    fetchMock.mockImplementation(async () => {
      throw new Error('should not call contacts API during opt-in')
    })

    const res = await POST(buildRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(200)
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalled()
    const values = Array.from(redisStore.values())
    expect(values).toContain('user@example.com')
  })
})

describe('GET /api/newsletter/confirm (Resend)', () => {
  function buildConfirmRequest(token: string) {
    return new Request(`http://localhost/api/newsletter/confirm?token=${token}`)
  }

  it('returns 400 for missing token', async () => {
    const res = await CONFIRM(buildConfirmRequest(''))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid or expired token', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'mock'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'mock'
    process.env.RESEND_API_KEY = 'test'
    process.env.RESEND_NEWSLETTER_AUDIENCE_ID = 'aud-1'
    const res = await CONFIRM(buildConfirmRequest('unknown'))
    expect(res.status).toBe(400)
  })

  it('writes contact to Resend and clears token', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'mock'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'mock'
    process.env.RESEND_API_KEY = 'test'
    process.env.RESEND_NEWSLETTER_AUDIENCE_ID = 'aud-1'
    redisStore.set('newsletter:confirm:abc', 'user@example.com')

    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      text: vi.fn().mockResolvedValue(''),
    } as any)

    const res = await CONFIRM(buildConfirmRequest('abc'))
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(redisStore.has('newsletter:confirm:abc')).toBe(false)
  })

  it('propagates upstream error during confirm', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'mock'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'mock'
    process.env.RESEND_API_KEY = 'test'
    process.env.RESEND_NEWSLETTER_AUDIENCE_ID = 'aud-1'
    redisStore.set('newsletter:confirm:err', 'user@example.com')

    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('boom'),
    } as any)

    const res = await CONFIRM(buildConfirmRequest('err'))
    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json).toMatchObject({ ok: false, error: 'upstream' })
  })
})

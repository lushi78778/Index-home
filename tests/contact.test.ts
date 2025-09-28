import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { ResendMock, resetResendMock, sendMock } from './mocks/resend'

vi.mock('resend', () => ({
  Resend: ResendMock,
}))

let POST: (req: Request) => Promise<Response>
const originalEnv = { ...process.env }

beforeAll(async () => {
  const mod = await import('@/app/api/contact/route')
  POST = mod.POST
})

beforeEach(() => {
  resetResendMock()
  process.env = { ...originalEnv }
  delete process.env.RESEND_API_KEY
  delete process.env.CONTACT_TO_EMAIL
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
})

afterAll(() => {
  process.env = originalEnv
})

function buildRequest(body: Record<string, any>) {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/contact', () => {
  it('returns 400 on invalid payload', async () => {
    const res = await POST(buildRequest({}))
    expect(res.status).toBe(400)
  })

  it('accepts honey pot submissions silently', async () => {
    const res = await POST(
      buildRequest({
        name: '张三',
        email: 'user@example.com',
        message: '这是超过十个字符的示例消息',
        website: 'robot-field',
      }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({ ok: true })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('skips email sending when credentials missing', async () => {
    const res = await POST(
      buildRequest({
        name: '张三',
        email: 'user@example.com',
        message: '这是超过十个字符的示例消息',
      }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({ ok: true })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('sends email via Resend when configured', async () => {
    process.env.RESEND_API_KEY = 'test'
    process.env.CONTACT_TO_EMAIL = 'owner@example.com'
    const res = await POST(
      buildRequest({
        name: '张三',
        email: 'user@example.com',
        message: '这是超过十个字符的示例消息',
      }),
    )
    expect(res.status).toBe(200)
    expect(sendMock).toHaveBeenCalledTimes(1)
    const [[args]] = sendMock.mock.calls
    expect(args).toMatchObject({
      to: 'owner@example.com',
      reply_to: 'user@example.com',
    })
  })

  it('propagates email failure', async () => {
    process.env.RESEND_API_KEY = 'test'
    process.env.CONTACT_TO_EMAIL = 'owner@example.com'
    sendMock.mockRejectedValueOnce(new Error('fail'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await POST(
      buildRequest({
        name: '张三',
        email: 'user@example.com',
        message: '这是超过十个字符的示例消息',
      }),
    )
    errorSpy.mockRestore()
    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json).toMatchObject({ ok: false, error: 'email_failed' })
  })
})

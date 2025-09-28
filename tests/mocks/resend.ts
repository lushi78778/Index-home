import { vi } from 'vitest'

type SendPayload = {
  to: string
  reply_to?: string
  [key: string]: unknown
}

export const sendMock = vi.fn<(payload: SendPayload) => Promise<void>>(async () => {})

export class ResendMock {
  emails = { send: sendMock }
  constructor(public apiKey: string) {}
}

export function resetResendMock() {
  sendMock.mockReset()
}

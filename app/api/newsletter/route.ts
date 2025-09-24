import { NextResponse } from 'next/server'
import { z } from 'zod'

const Schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  const data = await req.json()
  const parsed = Schema.safeParse(data)
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })
  // TODO: 对接 Buttondown/ConvertKit/Resend API
  return NextResponse.json({ ok: true })
}

import { headers } from 'next/headers'

type Json = Record<string, any>

export function JsonLd({ data }: { data: Json }) {
  const h = headers()
  const nonce = h.get('x-nonce') || undefined
  return (
    <script
      type="application/ld+json"
      // 仅用于 CSP，若未设置将回退为无 nonce
      nonce={nonce as any}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

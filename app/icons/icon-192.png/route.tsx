import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          color: '#0b1220',
          fontSize: 84,
          fontWeight: 800,
        }}
      >
        X
      </div>
    ),
    { width: 192, height: 192 },
  )
}

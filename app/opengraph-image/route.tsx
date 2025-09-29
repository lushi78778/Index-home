/**
 * 动态 Open Graph 图片（GET /opengraph-image?title=...）
 * - 运行于 Edge Runtime
 * - 根据 query.title 渲染简单文本卡片，默认取站点短名
 */
import { ImageResponse } from '@vercel/og'
import { siteConfig } from '@/config/site'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // 优先使用 query.title，缺省时回退到站点短名
  const title = searchParams.get('title') || siteConfig.shortName
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b1220',
          color: 'white',
          fontSize: 64,
          fontWeight: 700,
        }}
      >
        {title}
      </div>
    ),
    { width: 1200, height: 630 },
  )
}

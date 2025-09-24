import { ImageResponse } from '@vercel/og'
import { getPostBySlug } from '@/lib/content'
import { siteConfig } from '@/config/site'

export const runtime = 'nodejs'

// 为每篇文章动态生成 OG 图片（标题 + 站点名 + 日期）
export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  const title = post?.title || siteConfig.name
  const date = post ? new Date(post.date).toLocaleDateString('zh-CN') : ''

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background: '#0b1220',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.2 }}>{title}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, opacity: 0.9 }}>
          <span>{siteConfig.shortName}</span>
          <span>{date}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}

import { ImageResponse } from '@vercel/og'
import { getAllProjects } from '@/lib/content'
import { siteConfig } from '@/config/site'

// Node.js runtime because we read local content
export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const project = getAllProjects().find((p) => p.slug === params.slug)
  const title = project?.title || siteConfig.name
  const subtitle = project?.description || siteConfig.shortName

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
        <div
          style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, opacity: 0.9 }}
        >
          <span>{siteConfig.shortName}</span>
          <span>{subtitle}</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}

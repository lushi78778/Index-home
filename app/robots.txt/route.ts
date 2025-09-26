import { siteConfig } from '@/config/site'

export function GET() {
  const content = `User-agent: *\nAllow: /\nSitemap: ${siteConfig.url}/sitemap.xml\n`
  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

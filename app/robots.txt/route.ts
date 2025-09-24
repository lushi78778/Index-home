import { siteConfig } from '@/config/site'

export function GET() {
  const content = `User-agent: *\nAllow: /\nSitemap: ${siteConfig.url}/sitemap.xml\n`
  return new Response(content, { headers: { 'Content-Type': 'text/plain' } })
}

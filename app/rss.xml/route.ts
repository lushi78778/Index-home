import { getAllPosts } from '@/lib/content'
import { siteConfig } from '@/config/site'

export function GET() {
  const items = getAllPosts().map(
    (p) => `
  <item>
    <title>${p.title}</title>
    <link>${siteConfig.url}/blog/${p.slug}</link>
    <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    <guid>${siteConfig.url}/blog/${p.slug}</guid>
    <description>${p.excerpt || ''}</description>
  </item>
`,
  )
  const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>${siteConfig.name}</title><link>${siteConfig.url}</link><description>${siteConfig.description}</description>${items.join('')}</channel></rss>`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } })
}

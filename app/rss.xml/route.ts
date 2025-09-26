import { getAllPosts } from '@/lib/content'
import { siteConfig } from '@/config/site'

function xmlEscape(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function sanitizeDesc(s?: string) {
  if (!s) return ''
  // Remove rudimentary HTML tags and collapse whitespace
  const text = s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return xmlEscape(text)
}

export function GET() {
  const items = getAllPosts({ includeDraft: false }).map(
    (p) => `
  <item>
    <title>${p.title}</title>
    <link>${siteConfig.url}/blog/${p.slug}</link>
    <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    <guid>${siteConfig.url}/blog/${p.slug}</guid>
    <description>${sanitizeDesc(p.excerpt)}</description>
  </item>
`,
  )
  const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>${siteConfig.name}</title><link>${siteConfig.url}</link><description>${siteConfig.description}</description>${items.join('')}</channel></rss>`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } })
}

import { getAllPosts, getAllProjects, getAllTags } from '@/lib/content'
import { siteConfig } from '@/config/site'

export function GET() {
  const urls: string[] = [
    '',
    'about',
    'projects',
    'contact',
    'subscribe',
    'search',
    'now',
    'uses',
  ].map((p) => `${siteConfig.url}/${p}`.replace(/\/$/, ''))

  const posts = getAllPosts().map((p) => `${siteConfig.url}/blog/${p.slug}`)
  const projects = getAllProjects().map((p) => `${siteConfig.url}/projects/${p.slug}`)
  const tags = getAllTags().map((t) => `${siteConfig.url}/tags/${encodeURIComponent(t.tag)}`)

  const now = new Date()
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${u}</loc><lastmod>${now.toISOString()}</lastmod></url>`).join('\n')}
${getAllPosts()
  .map((p) => `<url><loc>${siteConfig.url}/blog/${p.slug}</loc><lastmod>${new Date(p.updated || p.date).toISOString()}</lastmod></url>`)
  .join('\n')}
${getAllProjects()
  .map((p) => `<url><loc>${siteConfig.url}/projects/${p.slug}</loc><lastmod>${new Date(p.date).toISOString()}</lastmod></url>`)
  .join('\n')}
${getAllTags()
  .map((t) => `<url><loc>${siteConfig.url}/tags/${encodeURIComponent(t.tag)}</loc><lastmod>${now.toISOString()}</lastmod></url>`)
  .join('\n')}
</urlset>`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } })
}

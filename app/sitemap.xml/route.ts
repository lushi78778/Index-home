import { getAllPosts, getAllProjects, getAllTags } from '@/lib/content'
import { siteConfig } from '@/config/site'
import { BLOG_PAGE_SIZE, SITEMAP_MAX_PAGINATION_PAGES } from '@/config/constants'

export function GET() {
  const urls: string[] = [
    '',
    'about',
    'blog',
    'resume',
    'projects',
    'tags',
    'notes',
    'contact',
    'subscribe',
    'search',
    'now',
    'uses',
  ].map((p) => `${siteConfig.url}/${p}`.replace(/\/$/, ''))

  const posts = getAllPosts({ includeDraft: false })
    .filter((p) => new Date(p.date).getTime() <= Date.now())
    .map((p) => `${siteConfig.url}/blog/${p.slug}`)
  const projects = getAllProjects().map((p) => `${siteConfig.url}/projects/${p.slug}`)
  const tags = getAllTags().map((t) => `${siteConfig.url}/tags/${encodeURIComponent(t.tag)}`)

  const now = new Date()
  // include blog pagination pages (limit via SITEMAP_MAX_PAGINATION_PAGES)
  const publishedCount = getAllPosts({ includeDraft: false }).filter(
    (p) => new Date(p.date).getTime() <= Date.now(),
  ).length
  const pageCount = Math.max(1, Math.ceil(publishedCount / BLOG_PAGE_SIZE))
  // only include pages starting from 2 (first page is /blog)
  const includePages = Math.min(SITEMAP_MAX_PAGINATION_PAGES, Math.max(0, pageCount - 1))
  const pageUrls = Array.from({ length: includePages }, (_, i) => i + 2)
    .map(
      (n) =>
        `<url><loc>${siteConfig.url}/blog/page/${n}</loc><lastmod>${now.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.4</priority></url>`,
    )
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `<url><loc>${u}</loc><lastmod>${now.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
  )
  .join('\n')}
${getAllPosts({ includeDraft: false })
  .filter((p) => new Date(p.date).getTime() <= Date.now())
  .map(
    (p) =>
      `<url><loc>${siteConfig.url}/blog/${p.slug}</loc><lastmod>${new Date(p.updated || p.date).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
  )
  .join('\n')}
${getAllProjects()
  .map(
    (p) =>
      `<url><loc>${siteConfig.url}/projects/${p.slug}</loc><lastmod>${new Date(p.date).toISOString()}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
  )
  .join('\n')}
${getAllTags()
  .map(
    (t) =>
      `<url><loc>${siteConfig.url}/tags/${encodeURIComponent(t.tag)}</loc><lastmod>${now.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>`,
  )
  .join('\n')}
</urlset>`
  const withPages = xml.replace('</urlset>', `${pageUrls}\n</urlset>`)
  return new Response(withPages, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

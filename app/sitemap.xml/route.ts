import { getAllProjects, getAllTags } from '@/lib/content'
import { listAllPublicDocs } from '@/lib/yuque'
import { siteConfig } from '@/config/site'

export async function GET() {
  const nowIso = new Date().toISOString()

  const staticUrls: string[] = [
    '',
    'about',
    'blog',
    'resume',
    'projects',
    'tags',
    'contact',
    'subscribe',
    'search',
  ].map((p) => `${siteConfig.url}/${p}`.replace(/\/$/, ''))

  const login = process.env.YUQUE_LOGIN || ''
  const yuqueDocs = login ? await listAllPublicDocs(login) : []
  const projects = getAllProjects()
  const tags = getAllTags()

  const blogUrls = yuqueDocs
    .map(
      (it) =>
        `<url><loc>${siteConfig.url}/blog/${it.namespace}/${it.doc.slug}</loc><lastmod>${new Date(it.doc.updated_at).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls
  .map(
    (u) =>
      `<url><loc>${u}</loc><lastmod>${nowIso}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
  )
  .join('\n')}
${blogUrls}
${projects
  .map(
    (p) =>
      `<url><loc>${siteConfig.url}/projects/${p.slug}</loc><lastmod>${new Date(p.date).toISOString()}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
  )
  .join('\n')}
${tags
  .map(
    (t) =>
      `<url><loc>${siteConfig.url}/tags/${encodeURIComponent(t.tag)}</loc><lastmod>${nowIso}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>`,
  )
  .join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

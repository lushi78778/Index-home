/**
 * 站点地图（GET /sitemap.xml）
 * - 包含静态页面、语雀博客文章、项目与标签页
 * - 缓存通过响应头配置；更新时间以 nowIso 或各资源时间为准
 */
import { getAllProjects, getAllTags } from '@/lib/content'
import { listAllPublicDocs } from '@/lib/yuque'
import { siteConfig } from '@/config/site'

export async function GET() {
  const nowIso = new Date().toISOString()

  // 静态页面路径：统一加上站点域名并移除可能的尾部斜杠
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

  // 数据源：语雀文章、项目列表与标签索引
  const login = process.env.YUQUE_LOGIN || ''
  const yuqueDocs = login ? await listAllPublicDocs(login) : []
  const projects = getAllProjects()
  const tags = getAllTags()

  // 组装博客文章条目，带有更新频率与优先级
  const blogUrls = yuqueDocs
    .map(
      (it) =>
        `<url><loc>${siteConfig.url}/blog/${it.namespace}/${it.doc.slug}</loc><lastmod>${new Date(it.doc.updated_at).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    )
    .join('\n')

  // 使用模板字面量拼接 XML 字符串
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

/**
 * robots.txt（GET /robots.txt）
 * - 允许所有爬虫抓取，并提供站点 Sitemap 地址
 */
import { siteConfig } from '@/config/site'

export function GET() {
  // 机器人规则（robots）：允许所有路径并指向站点地图
  const content = `User-agent: *\nAllow: /\nSitemap: ${siteConfig.url}/sitemap.xml\n`
  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

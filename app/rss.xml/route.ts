/**
 * RSS 订阅源（GET /rss.xml）
 * - 数据源：语雀公开文档列表（按 namespace + slug 生成条目链接）
 * - 缓存：短期 CDN 缓存与 revalidate 策略由响应头控制
 */
import { listAllPublicDocs } from '@/lib/yuque'
import { siteConfig } from '@/config/site'

// 生成 RSS 时需先转义 XML 特殊字符，避免破坏结构
function xmlEscape(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const login = process.env.YUQUE_LOGIN || ''
  // 若配置语雀账号则抓取公开文档，未配置时返回空数组
  const docs = login ? await listAllPublicDocs(login) : []

  // 构造 RSS items，每篇文章包含类别、时间与内容片段
  const items = docs.map((it) => {
    const link = `${siteConfig.url}/blog/${it.namespace}/${it.doc.slug}`
    const title = xmlEscape(it.doc.title)
    const desc = xmlEscape(`${it.namespace}`)
    const categories = [`${it.login}`, `${it.repo}`]
      .map((c) => `\n    <category>${xmlEscape(c)}</category>`)
      .join('')
    return `
  <item>
    <title>${title}</title>
    <link>${link}</link>
    <pubDate>${new Date(it.doc.updated_at).toUTCString()}</pubDate>
    <guid>${link}</guid>
    <description>${desc}</description>
    <content:encoded><![CDATA[<p>${title}</p>]]></content:encoded>
    ${categories}
  </item>`
  })

  // 组装 RSS XML 主体并写入响应
  const xml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<rss version=\"2.0\" xmlns:content=\"http://purl.org/rss/1.0/modules/content/\">
  <channel>
    <title>${xmlEscape(siteConfig.name)}</title>
    <link>${siteConfig.url}</link>
    <description>${xmlEscape(siteConfig.description)}</description>
    <language>${siteConfig.defaultLocale || 'zh'}</language>
    ${items.join('')}
  </channel>
</rss>`
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

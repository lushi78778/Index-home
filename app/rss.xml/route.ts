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

function stripMarkdown(md: string) {
  // 极简剥离 Markdown/HTML，仅用于 RSS 描述兜底
  return md
    // 代码块/行内代码
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    // 链接与图片: [text](url) 或 ![alt](url)
    .replace(/!?\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // 标题/粗体/斜体/引用/列表符号
    .replace(/^#+\s+/gm, '')
    .replace(/[>*_~`#-]+/g, ' ')
    // HTML 标签
    .replace(/<[^>]+>/g, ' ')
}

function sanitizeDesc(s?: string) {
  if (!s) return ''
  const text = s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return xmlEscape(text)
}

export function GET() {
  const items = getAllPosts({ includeDraft: false }).map((p) => {
    // 描述兜底：优先 excerpt，否则从正文提取前 160 字符
    const desc = p.excerpt && p.excerpt.trim().length > 0
      ? sanitizeDesc(p.excerpt)
      : xmlEscape(stripMarkdown(p.content).replace(/\s+/g, ' ').trim().slice(0, 160))
    const link = `${siteConfig.url}/blog/${p.slug}`
    // content:encoded 使用更长的 HTML 片段（CDAT A 包裹），优先 excerpt；否则取正文前 400 字符
    const longText = p.excerpt?.trim().length
      ? p.excerpt.trim()
      : stripMarkdown(p.content).replace(/\s+/g, ' ').trim().slice(0, 400)
    const contentEncoded = `<![CDATA[<p>${longText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>]]>`
    // enclosure（若存在封面或 og 图）
    const image = (p.ogImage || p.cover) as string | undefined
    const type = image?.endsWith('.png')
      ? 'image/png'
      : image?.match(/\.jpe?g$/)
      ? 'image/jpeg'
      : image?.endsWith('.webp')
      ? 'image/webp'
      : image
      ? 'image/*'
      : undefined
    const categories = (p.tags || []).map((t) => `\n    <category>${xmlEscape(t)}</category>`).join('')
    return `
  <item>
    <title>${xmlEscape(p.title)}</title>
    <link>${link}</link>
    <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    <guid>${link}</guid>
    <description>${desc}</description>
    <content:encoded>${contentEncoded}</content:encoded>
    ${image && type ? `<enclosure url="${xmlEscape(image)}" type="${type}" />` : ''}
    ${categories}
  </item>`
  })
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

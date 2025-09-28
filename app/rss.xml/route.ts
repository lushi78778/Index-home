import { listAllPublicDocs } from '@/lib/yuque'
import { siteConfig } from '@/config/site'

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
  const docs = login ? await listAllPublicDocs(login) : []

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

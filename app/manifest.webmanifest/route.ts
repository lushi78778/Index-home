/**
 * PWA Manifest（GET /manifest.webmanifest）
 * - 使用站点配置生成基本清单：名称、主题色、图标等
 */
import { siteConfig } from '@/config/site'

export function GET() {
  // 基于站点配置生成最小化 PWA 清单结构
  const json = {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      // 各尺寸图标：兼容标准、maskable 及高分辨率场景
      { src: '/icon.svg', sizes: '64x64', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  }
  return new Response(JSON.stringify(json), {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}

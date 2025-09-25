import { siteConfig } from '@/config/site'

export function GET() {
  const json = {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      { src: '/icon.svg', sizes: '64x64', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  }
  return new Response(JSON.stringify(json), {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}

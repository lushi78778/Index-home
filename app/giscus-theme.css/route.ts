export const runtime = 'edge'

const css = `/* 自定义 Giscus 主题：基于官方主题并移除 max-width 约束 */
@import url('https://giscus.app/themes/preferred_color_scheme.css');

.giscus { max-width: none !important; width: 100% !important; }
.giscus * { box-sizing: border-box; }
.giscus .giscus-container { max-width: none !important; width: 100% !important; }
.giscus .giscus-container > * { max-width: none !important; width: 100% !important; }

/* 轻微增大编辑域字号与行高，可按需调整 */
.giscus .gsc-comment-box-textarea { font-size: 14px !important; line-height: 1.6 !important; }
`

import { NextResponse } from 'next/server'

export function GET() {
  const res = new NextResponse(css, {
    status: 200,
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
  // 允许 giscus.app 跨域加载自定义主题
  res.headers.set('Access-Control-Allow-Origin', '*')
  return res
}

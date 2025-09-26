/**
 * 自定义 giscus 主题：仅扩展宽度，颜色仍使用官方样式。
 * - 我们先引入 giscus 官方的自动随系统主题的样式，保证配色一致。
 * - 然后覆盖内部容器的最大宽度，让评论区可以占据 100% 宽度。
 */

export const dynamic = 'force-static'

export async function GET() {
  const css = `
/* 先引入 giscus 官方主题（自动跟随系统） */
@import url('https://giscus.app/themes/preferred_color_scheme.css');

/* 布局覆盖：在 iframe 内让评论区内容居中自适应，与页面容器一致 */
:root {
  /* 填满外部容器宽度（与上方分隔线一致） */
  --giscus-content-max-width: 100%;
  --giscus-side-padding: 0; /* 外层已有主容器内边距，这里置 0 以严格对齐 */
}

/* 统一盒模型 */
.giscus, .giscus * { box-sizing: border-box; }

/* 移除 iframe 文档级默认边距，避免出现 4~8px 的默认 body margin */
html, body {
  margin: 0 !important;
  padding: 0 !important;
}

/* 让最外层和内部主容器撑满可用宽度，但不超过 max */
.giscus {
  width: 100% !important;
}

/* giscus 的主要列区域（包含评论列表、输入框） */
.gsc-main {
  max-width: var(--giscus-content-max-width) !important;
  margin-left: auto !important;
  margin-right: auto !important;
  padding-left: var(--giscus-side-padding) !important;
  padding-right: var(--giscus-side-padding) !important;
  width: 100% !important;
}

/* 有些层级包裹在 .gsc-main > .gsc-wrapper 或类似命名中，这里兜底清零 */
.gsc-main > div,
.gsc-main > section,
.gsc-main > .gsc-wrapper,
.gsc-main .gsc-reactions,
.gsc-main .gsc-comment-box {
  margin-left: 0 !important;
  margin-right: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* 容器守卫：有些主题内部还包过一层限制宽度的 div，统一解除 */
.giscus > div,
.gsc-container,
.gsc-left,
.gsc-right {
  max-width: 100% !important;
  width: 100% !important;
  margin: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* 某些子容器也拉伸到全宽，避免被内部默认宽度限制 */
.gsc-comments,
.gsc-comment-box,
.gsc-reply-box,
.gsc-timeline,
.gsc-header,
.gsc-footer {
  width: 100% !important;
  max-width: 100% !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}
`

  return new Response(css, {
    headers: {
      'content-type': 'text/css; charset=utf-8',
      'cache-control': 'public, max-age=3600',
      // 允许跨域 iframe （giscus.app）直接获取并在 DevTools 里可预览
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, HEAD, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
      // 允许性能信息在跨域中可见（可选）
      'timing-allow-origin': '*',
    },
  })
}

// 处理 Chrome DevTools 的探测请求，避免开发环境返回 500 错误
export function GET() {
  // 返回 404 与空 JSON，确保调试工具静默处理该探测
  return new Response('{}', {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  })
}

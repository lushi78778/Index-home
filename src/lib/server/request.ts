import "server-only"

/**
 * 提取客户端 IP：优先使用代理链头部，第一个地址视为真实来源。
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded && forwarded.trim()) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  const realIp = req.headers.get("x-real-ip")
  if (realIp && realIp.trim()) return realIp.trim()
  return "local"
}

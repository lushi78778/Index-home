import "server-only"

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

type SlidingWindowInterval = `${number} ${"s" | "m" | "h" | "d"}`

export type RateLimitOptions = {
  identifier: string
  limit: number
  window: SlidingWindowInterval
}

export type RateLimitAllowed = { success: true }
export type RateLimitBlocked = {
  success: false
  headers: Record<string, string>
  reset?: number
}
export type RateLimitResult = RateLimitAllowed | RateLimitBlocked

let redisClient: Redis | null = null
let redisConfig: { url: string; token: string } | null = null

export function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    redisClient = null
    redisConfig = null
    return null
  }
  if (!redisClient || !redisConfig || redisConfig.url !== url || redisConfig.token !== token) {
    redisClient = new Redis({ url, token })
    redisConfig = { url, token }
  }
  return redisClient
}

export async function enforceSlidingWindowRateLimit(
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const redis = getRedisClient()
  if (!redis) return { success: true }

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(options.limit, options.window),
  })

  const { success, reset, limit, remaining } = await ratelimit.limit(options.identifier)
  if (success) return { success: true }

  const nowSec = Math.floor(Date.now() / 1000)
  const retryAfter = Math.max(1, (reset || nowSec) - nowSec)
  const headers: Record<string, string> = { "Retry-After": String(retryAfter) }
  if (typeof limit === "number") headers["X-RateLimit-Limit"] = String(limit)
  if (typeof remaining === "number") headers["X-RateLimit-Remaining"] = String(remaining)

  return { success: false, headers, reset }
}

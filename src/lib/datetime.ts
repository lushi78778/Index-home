/**
 * @file 日期时间格式化工具
 * @description 统一提供日期与日期时间的本地化格式化函数。
 */
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/**
 * 安全转换输入为 Date 实例，无法解析时返回 null。
 */
function toDate(value?: string | number | Date) {
  if (!value) return null
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * 格式化为“日期 + 时间”，如 2025/09/29 21:30
 */
export function formatDateTime(value?: string | number | Date, fallback = '--') {
  const date = toDate(value)
  return date ? dateTimeFormatter.format(date) : fallback
}

/**
 * 仅格式化为“日期”，如 2025/09/29
 */
export function formatDate(value?: string | number | Date, fallback = '--') {
  const date = toDate(value)
  return date ? dateFormatter.format(date) : fallback
}

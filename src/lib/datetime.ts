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

function toDate(value?: string | number | Date) {
  if (!value) return null
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateTime(value?: string | number | Date, fallback = '--') {
  const date = toDate(value)
  return date ? dateTimeFormatter.format(date) : fallback
}

export function formatDate(value?: string | number | Date, fallback = '--') {
  const date = toDate(value)
  return date ? dateFormatter.format(date) : fallback
}

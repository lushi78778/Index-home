import React from 'react'

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-lg border bg-background p-4 shadow-sm ${className}`}>{children}</div>
  )
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  // 与 /blog 列表的间距保持一致：标题与描述之间留出 0.25rem 间距
  return <div className="mb-2 space-y-1">{children}</div>
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  // 调整行高与字间距，使其更接近博客列表的排版（不改变字号）
  return <h3 className="text-lg font-semibold leading-snug">{children}</h3>
}

export function CardDescription({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 space-y-2">{children}</div>
}

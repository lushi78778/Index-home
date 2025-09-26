"use client"

import { AlertCircle, Info, Lightbulb, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

type CalloutType = 'info' | 'tip' | 'warning' | 'danger' | 'note'

const typeStyle: Record<CalloutType, { icon: React.ComponentType<any>; className: string; label: string }> = {
  info: { icon: Info, className: 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-700/60 dark:bg-sky-950/40 dark:text-sky-100', label: '提示' },
  tip: { icon: Lightbulb, className: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-100', label: '技巧' },
  warning: { icon: AlertCircle, className: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100', label: '注意' },
  danger: { icon: ShieldAlert, className: 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-700/60 dark:bg-rose-950/40 dark:text-rose-100', label: '警告' },
  note: { icon: Info, className: 'border-muted bg-muted/30 text-foreground', label: '注记' },
}

export function Callout({ type = 'info', title, children }: { type?: CalloutType; title?: string; children?: React.ReactNode }) {
  const t = typeStyle[type]
  const Icon = t.icon
  return (
    <div className={cn('my-4 rounded-md border p-3 text-sm', t.className)}>
      <div className="mb-1 flex items-center gap-2 font-medium">
        <Icon className="h-4 w-4" aria-hidden />
        <span>{title || t.label}</span>
      </div>
      <div className="prose prose-sm dark:prose-invert">
        {children}
      </div>
    </div>
  )
}

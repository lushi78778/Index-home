import React from 'react'

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'secondary' | 'outline' }) {
  const base = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs'
  const style =
    variant === 'secondary'
      ? 'bg-secondary text-secondary-foreground'
      : variant === 'outline'
      ? 'border text-foreground'
      : 'bg-primary text-primary-foreground'
  return <span className={`${base} ${style}`}>{children}</span>
}

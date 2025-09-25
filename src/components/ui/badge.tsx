import React from 'react'

export function Badge({ children, variant = 'secondary' }: { children: React.ReactNode; variant?: 'secondary' | 'outline' }) {
  // 对齐博客页标签的视觉密度：保持字号不变，略放松左右内边距
  const base = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs'
  const styles =
    variant === 'secondary'
      ? `${base} bg-secondary text-secondary-foreground`
      : `${base} border text-foreground`
  return <span className={styles}>{children}</span>
}

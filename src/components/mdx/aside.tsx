/**
 * @file Aside 侧注块
 * @description 在正文旁展示补充信息的装饰性内容区域。
 */
import * as React from 'react'
import { cn } from '@/lib/utils'

export function Aside({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <aside
      className={cn(
        'my-4 rounded-md border-l-4 border-primary/60 bg-primary/5 p-3 text-sm',
        className,
      )}
    >
      {children}
    </aside>
  )
}

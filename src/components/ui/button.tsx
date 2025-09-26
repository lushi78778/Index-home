'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Button 按钮组件（简化版）
 * - 说明：参考 shadcn/ui 的风格与 API，满足项目基础需求
 * - 变体：primary | secondary | ghost | link | destructive
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none'
    const sizes = {
      sm: 'h-8 px-3',
      md: 'h-9 px-4',
      lg: 'h-10 px-6',
    }
    const variants = {
      primary: 'bg-primary text-primary-foreground shadow hover:opacity-90',
      secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
      ghost: 'bg-transparent hover:bg-accent',
      link: 'bg-transparent underline underline-offset-4 text-primary',
      destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
    }

    return (
      <button
        ref={ref}
        className={cn(base, sizes[size], variants[variant], className)}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'

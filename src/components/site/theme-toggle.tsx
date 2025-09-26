'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

// 主题切换按钮
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <Button
      aria-label="切换主题"
      variant="ghost"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  )
}

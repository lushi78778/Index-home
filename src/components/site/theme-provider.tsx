'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

// 主题提供者：封装 next-themes，支持浅/深色
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}

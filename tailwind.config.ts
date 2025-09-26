/**
 * @file Tailwind CSS 配置文件
 * @description
 * 本文件用于配置 Tailwind CSS 的行为，包括主题、插件和内容源。
 * 它是项目设计系统的核心，定义了颜色、圆角、动画等视觉元素。
 * 配置与 shadcn/ui 紧密集成，使用了 CSS 变量来定义颜色方案，
 * 从而实现了动态主题切换（如浅色/深色模式）。
 */

import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  // 启用深色模式，策略为 'class'
  // 这意味着当 <html> 标签包含 'dark' 类时，深色模式的样式将生效
  darkMode: ['class'],

  // 配置 Tailwind CSS 需要扫描以查找工具类（utility classes）的文件路径
  // 包含了 src、app 目录下的所有 ts/tsx 文件，以及 content 目录下的 md/mdx 文件
  // 确保所有使用到 Tailwind 类的地方都被正确处理
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', './content/**/*.{md,mdx}'],

  // 自定义和扩展 Tailwind 的默认主题
  theme: {
    extend: {
      // 颜色配置，完全基于 CSS 变量
      // 这种方法使得主题切换变得简单，只需在全局 CSS 中更改变量值即可
      // 变量定义在 `src/styles/globals.css` 中
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      // 自定义圆角大小，同样使用 CSS 变量
      // 这允许全局统一调整组件的圆角风格
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      // 定义自定义的 keyframes 动画，用于 shadcn/ui 的 Accordion (手风琴) 组件
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },

      // 将上面定义的 keyframes 应用为可用的 animation 工具类
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },

  // 注册 Tailwind 插件
  // `@tailwindcss/typography` 提供了 `prose` 类，用于美化由 MDX 或 CMS 生成的富文本内容
  plugins: [typography],
}

export default config

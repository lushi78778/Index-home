/**
 * @file Next.js 配置文件
 * @description
 * 本文件负责配置 Next.js 项目的核心行为，通过组合多个插件来扩展功能。
 * 主要集成了以下功能：
 * 1.  `@next/mdx`：使项目能够直接使用 MDX 文件作为页面或组件，增强内容编写能力。
 * 2.  `next-pwa`：为应用提供渐进式网络应用（PWA）能力，支持离线访问和缓存策略。
 * 3.  `next-intl`：集成国际化路由，实现多语言支持。
 */

import createMDX from '@next/mdx'
import withPWA from 'next-pwa'
import createNextIntlPlugin from 'next-intl/plugin'

// 初始化 MDX 插件，用于解析 .mdx 和 .md 文件
const withMDX = createMDX({
  extension: /\.mdx?$/,
})

// 初始化 next-intl 插件
// 它会根据指定的配置文件，自动处理国际化路由和本地化内容的加载
// 参考: https://next-intl.dev/docs/getting-started/app-router
const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 定义 Next.js 可以识别的页面文件扩展名
  // 添加 'mdx' 是为了让 MDX 文件也能被当作页面处理
  pageExtensions: ['ts', 'tsx', 'mdx'],
  experimental: {
    // 启用类型化路由，可以为内部链接提供更好的类型提示和自动补全
    typedRoutes: true,
  },
}

/**
 * 使用插件组合函数来包裹 Next.js 的基础配置
 * @param {import('next').NextConfig} cfg - 基础 Next.js 配置
 * @returns {import('next').NextConfig} - 应用了所有插件后的最终配置
 */
const applyPlugins = (cfg) => {
  // 首先应用 MDX 插件
  const configWithMDX = withMDX(cfg)

  // 然后应用 PWA 插件
  // PWA 功能仅在生产环境中启用，以避免影响开发体验
  const configWithPWA = withPWA({
    dest: 'public', // Service Worker 和相关文件的输出目录
    disable: process.env.NODE_ENV === 'development', // 在开发环境中禁用 PWA
    register: true, // 自动注册 Service Worker
    skipWaiting: true, // 新的 Service Worker 安装后立即激活，跳过等待
    runtimeCaching: [
      // 运行时缓存策略，用于处理动态请求
      // 1. HTML 导航请求：网络优先，超时后回退到缓存
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'html-cache',
          networkTimeoutSeconds: 3, // 3秒网络超时
        },
      },
      // 2. Next.js 静态资源：缓存优先，提供极速加载
      {
        urlPattern: /\/_next\/static\//,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets-cache',
          expiration: {
            maxEntries: 100, // 最多缓存 100 个条目
            maxAgeSeconds: 60 * 60 * 24 * 30, // 缓存 30 天
          },
        },
      },
      // 3. 图标和 SVG：缓存优先，因为它们很少变动
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/icons/') || url.pathname.endsWith('.svg'),
        handler: 'CacheFirst',
        options: {
          cacheName: 'icons-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 缓存 1 年
          },
        },
      },
      // 4. 图片资源：后台更新策略，优先从缓存读取，同时后台请求新版本
      {
        urlPattern: ({ request }) => request.destination === 'image',
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 缓存 30 天
          },
        },
      },
      // 5. 第三方服务（如分析、评论）：后台更新策略
      {
        urlPattern: /https:\/\/(plausible\.io|giscus\.app)\//,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'third-party-cache',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 缓存 7 天
          },
        },
      },
    ],
    // 定义离线回退页面
    // 当用户离线且无法从缓存中获取页面时，将显示此页面
    fallbacks: {
      document: '/_offline',
    },
  })(configWithMDX)

  return configWithPWA
}

// 导出最终配置
// 插件的应用顺序是：基础配置 -> MDX -> PWA -> 国际化
// 这种链式调用确保了每个插件都能正确地修改和扩展配置
export default withNextIntl(applyPlugins(nextConfig))

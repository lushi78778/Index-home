// Next.js 配置（支持 MDX）
// 说明：
// - 启用 App Router（Next.js 14 默认为 app 目录）
// - 集成 @next/mdx，以便在项目中使用 .mdx 文件
// - 可通过环境变量 ANALYZE 控制后续分析（预留）
import createMDX from '@next/mdx'

const withMDX = createMDX({
  extension: /\.mdx?$/,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  experimental: {
    typedRoutes: true,
  },
}

export default withMDX(nextConfig)

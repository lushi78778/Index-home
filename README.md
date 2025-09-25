# Index-home

一个“快速、内容优先、强 SEO、可长期维护”的个人主页模板，实现基于 Next.js App Router + TypeScript + Tailwind + MDX，并按 action.txt 的落地方案执行。

## 技术栈与原则
- Next.js 14（App Router, RSC/ISR）
- TypeScript，Tailwind（自定义设计令牌，贴合 shadcn/ui 风格）
- MDX 内容（gray-matter + zod 校验 + reading-time）
- 轻量设计系统：Button/Badge/Card/Dialog/Pagination/Toast
- 客户端搜索：静态索引 + MiniSearch
- 动态 OG：@vercel/og（Satori）
- 安全与质量：CSP/HSTS/隐私友好分析（Plausible 可选）+ Vitest + GitHub Actions
- PWA：next-pwa（生产环境启用，离线缓存与 SW 自动注册）

## 主要能力
- 路由与页面
	- 首页、博客列表/详情、项目列表/详情、关于、联系、订阅、搜索、标签（索引/详情）、Notes、Now、Uses
	- 系统路由：`/rss.xml`、`/sitemap.xml`、`/robots.txt`、`/manifest.webmanifest`、`/opengraph-image`
- 内容系统
	- `src/lib/content.ts` 定义 Post/Project/Note 的 zod 模型与读入逻辑；draft 过滤、readingTime、标签聚合
	- 文章页含服务端 TOC、阅读进度、上一篇/下一篇、JSON-LD（BlogPosting/Breadcrumb/Person）
- 搜索
	- `/api/search-index` 暴露静态索引；`/search` 客户端使用 MiniSearch，支持前缀与模糊
- 交互与设计系统
	- Toast、Dialog、Card、Badge、Pagination 基础组件；BackToTop 返回顶部；
	- 联系/订阅表单使用 react-hook-form + zod 校验，toast 反馈；联系接口内置蜜罐与内存限流
- SEO/分享/性能
	- 全局 `metadata` 与 per-page `generateMetadata`；动态 OG 图；`next/font`(Inter) 自托管减少 CLS；
	- `middleware.ts` 增加 CSP/Referrer-Policy/X-Content-Type-Options/Permissions-Policy/HSTS（保守策略，可进一步收紧）

## 目录速览
- 全局配置：`src/config/site.ts`
- 全局样式：`src/styles/globals.css`
- 内容模型：`src/lib/content.ts`
- 组件：`src/components/**`
- 页面：`app/**`
- 内容：`content/**`

## 开发与运行
```bash
npm install
npm run dev
```
- 如果 3000 被占用，会自动切到 3001。

类型检查与测试：
```bash
npm run typecheck
npm test
npm run e2e       # 端到端测试（会自动启动 dev 服务器）
npm run e2e:ui    # 可视化查看用例
```

生产构建：
```bash
npm run build
npm run start
```

提示：
- 生产构建会启用 PWA（service worker）并缓存关键资源；本地开发默认禁用。
- 中间件会为每次请求注入 CSP Nonce，并传递到分析脚本避免 'unsafe-inline'，生产可适度收紧 CSP。

## 环境变量
复制 `.env.example` 到 `.env.local` 并按需填写：
- `RESEND_API_KEY`、`CONTACT_TO_EMAIL`：联系表单邮件发送（可选，未配置时接口会直接返回成功，方便开发）
- `REVALIDATE_SECRET`：保护 `/api/revalidate` 的密钥
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`：Plausible 分析域（可选，设置后自动注入）

注意：
- 上线前请将 `src/config/site.ts` 的 `url`、`author`、`social` 替换为真实值，否则 OG/RSS/Sitemap 的绝对链接不正确。
- `middleware.ts` 的 CSP 当前包含 `'unsafe-inline'`（为兼容保留），建议生产切换到 nonce/hash 并收紧来源白名单；HSTS 仅在正式域名生效。

## 与 action.txt 对照
- Done：核心路由与内容模型；搜索索引 + 客户端搜索；动态 OG；文章阅读体验（TOC/阅读进度/返回顶部）；安全头基础 + CSP Nonce；CI；全局主题与导航；全局/页面 SEO；设计系统基础组件；next/font；PWA（生产）。
- Partial：分页 rel/robots 策略细化；表单限流迁移 Upstash；newsletter 对接第三方；图片统一用 next/image 并补占位；Vercel Analytics（可选）。
- Next：i18n、评论（Giscus 已接入可开关）、更多组件（dropdown-menu/tooltip/tabs）、E2E + a11y 测试；PWA 预缓存清单与 runtime 缓存策略细化；图片 LQIP/占位与尺寸策略。

## CI
GitHub Actions：安装依赖 → `typecheck` → `test` → `build`（见 `.github/workflows/ci.yml`）。
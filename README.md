# Index-home

个人主页落地（Next.js App Router + TypeScript + Tailwind + shadcn/ui 风格 + MDX）

## 开发

```powershell
npm install
npm run dev
```

如果端口 3000 被占用，会自动切到 3001。

TypeScript 类型检查与测试：

```powershell
npm run typecheck
npm test
```

## 生产

```powershell
npm run build
npm run start
```

## 主要特性
- App Router + TypeScript
- Tailwind 自定义设计令牌（与 shadcn/ui 风格一致）
- MDX 内容 + Zod Frontmatter 校验 + reading-time
- 路由：Home/Blog/Article/Projects/About/Contact/Subscribe/Search/Tags/Notes/Now/Uses
- API：/api/contact, /api/newsletter, /api/search-index, /api/revalidate
- 系统路由：/rss.xml, /sitemap.xml, /robots.txt, /manifest.webmanifest, /opengraph-image
- SEO：metadata/openGraph/twitter + RSS/Sitemap/Robots + 动态 OG
- 搜索：构建期静态索引 + 客户端 MiniSearch

## 路径速览
- 全局配置：`src/config/site.ts`
- 全局样式：`src/styles/globals.css`
- 内容模型：`src/lib/content.ts`
- 组件：`src/components/**`
- 页面：`app/**`
- 内容：`content/**`

## TODO
- 文章 TOC/代码高亮主题增强/行号/返回顶部
- 列表分页组件化与 SEO rel 标注
- 表单服务接入（Resend/SMTP）+ 速率限制
- 字体子集化与性能优化
- 测试与 CI（Vitest/Playwright/GitHub Actions）

## 环境变量
复制 `.env.example` 到 `.env.local` 并按需填写：

- `RESEND_API_KEY`、`CONTACT_TO_EMAIL`：联系表单邮件发送（可选，未配置时会直接返回成功，便于开发）
- `REVALIDATE_SECRET`：保护 `/api/revalidate` 的密钥
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`：Plausible 分析（可选）

## CI
已提供 GitHub Actions 工作流：

- 安装依赖 → `typecheck` → `test` → `build`
- 文件：`.github/workflows/ci.yml`
# Index-home

这是一个基于 Next.js App Router 构建的现代化、内容驱动的个人主页。它不仅仅是一个博客，更是一个集项目展示、个人介绍、技术笔记、实时动态于一体的综合性平台。


## ✨ 功能特性

- **内容管理**:
  - **MDX 支持**: 使用 MDX 撰写文章和项目介绍，可在内容中灵活嵌入 React 组件。
  - **内容聚合**: 博客、项目、笔记三大内容类型，支持元数据（Frontmatter）定义。
  - **标签系统**: 对文章和项目进行分类，提供标签聚合页。

- **核心页面**:
  - **动态首页**: 包含个人简介、精选文章、项目和社交链接。
  - **博客系统**: 文章列表、分页、阅读进度、目录（TOC）、代码高亮、Giscus 评论系统。
  - **项目展示**: 按分类展示个人项目，包含技术栈、链接和详细介绍。
  - **独立页面**: 关于我 (`/about`)、当前动态 (`/now`)、我的装备 (`/uses`)。

- **互动功能**:
  - **联系表单**: 通过 Server Action 实现，集成邮件发送服务。
  - **邮件订阅**: 对接外部邮件服务，提供订阅功能。
  - **客户端搜索**: 基于 `MiniSearch` 实现全文搜索，构建时生成静态索引，速度快、无后端依赖。

- **技术实现**:
  - **国际化 (i18n)**: 支持多语言内容，通过路由 (`/en`, `/zh`) 区分。
  - **动态 OG 图**: 为文章和项目动态生成精美的 Open Graph 图片，提升社交分享体验。
  - **SEO 优化**: 自动生成 `sitemap.xml` 和 `rss.xml`，支持 JSON-LD 结构化数据。
  - **PWA 支持**: 支持离线访问和“添加到主屏幕”功能。

- **开发与测试**:
  - **类型安全**: 全程使用 TypeScript，从源码到内容元数据。
  - **自动化测试**: 集成 Vitest 进行单元测试，Playwright 进行 E2E 测试。
  - **代码质量**: 使用 ESLint 和 Prettier 保证代码风格和质量一致。

## 🚀 技术栈

- **框架**: [Next.js](https://nextjs.org/) (App Router)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **内容**: [MDX](https://mdxjs.com/)
- **表单**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **测试**: [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)
- **评论**: [Giscus](https://giscus.app/)
- **部署**: [Vercel](https://vercel.com/)

## 本地开发

1.  **克隆仓库**
    ```bash
    git clone https://github.com/lushi78778/Index-home.git
    cd Index-home
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **配置环境变量**
    复制 `.env.example` 文件为 `.env.local`，并根据需要填写其中的变量，例如 Giscus 和邮件服务的配置。
    ```bash
    cp env.example .env.local
    ```

4.  **启动开发服务器**
    ```bash
    npm run dev
    ```
    现在，你可以在 [http://localhost:3000](http://localhost:3000) 访问你的本地站点。

## 📜 Scripts

- `npm run dev`: 启动开发服务器。
- `npm run build`: 构建生产版本。
- `npm run start`: 启动生产服务器。
- `npm run lint`: 运行 ESLint 代码检查。
- `npm run format`: 使用 Prettier 格式化代码。
- `npm test`: 运行 Vitest 单元测试。
- `npm run test:e2e`: 运行 Playwright 端到端测试。

## 部署

本项目可以配置为在 Vercel 上一键部署。只需将你的 GitHub 仓库连接到 Vercel，它将自动处理构建和部署流程。
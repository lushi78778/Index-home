# Index-home 开发者手册

> 一套基于 Next.js App Router 的内容门户基线，支持 Yuque + 本地 MDX 双内容源、全链路自动化配置、完善的测试与运维工具集。

本文档覆盖环境准备、目录结构、配置生成、常用工作流、质量保障、部署方案与故障排查。

---

## 目录
- [项目概览](#项目概览)
- [技术栈与目录结构](#技术栈与目录结构)
- [环境准备与体检](#环境准备与体检)
- [配置与生成（configyaml--sitetsenvlocal）](#配置与生成configyaml--sitetsenvlocal)
- [开发与调试（常用工作流）](#开发与调试常用工作流)
- [Makefile 目标详解（中文注释版）](#makefile-目标详解中文注释版)
- [内容来源（语雀--本地-mdx）](#内容来源语雀--本地-mdx)
- [测试与质量（VitestPlaywrightLHCI）](#测试与质量vitestplaywrightlhci)
- [API 路由与页面一览](#api-路由与页面一览)
- [部署与运维（DockerCompose）](#部署与运维dockercompose)
- [故障排查 FAQ（含命令示例）](#故障排查-faq含命令示例)
- [安全与最佳实践](#安全与最佳实践)
- [常用命令速查表（Cheat-Sheet）](#常用命令速查表cheat-sheet)

---

## 项目概览
- **定位**：个人/团队内容门户基线，兼容博客、作品集、团队站、语雀知识库等场景。
- **核心特性**：
  - 双源内容：语雀开放 API（实时内容）+ 本地 MDX（项目/专题），统一渲染与搜索。
  - 配置即代码：使用 `config.yaml` 单一事实来源，通过脚本生成 TS 配置与 `.env.local`，杜绝漂移。
  - 全链路质量：严格 TypeScript、ESLint/Prettier、Vitest 单测、Playwright E2E、LHCI 性能监测。
  - 安全与可观测：CSP + 安全响应头、Upstash 限流、Resend 邮件与订阅、MiniSearch 本地索引、Plausible 分析。
  - 工具链完善：Makefile、Docker、多环境部署清晰，内置健康检查与调试接口。

---

## 技术栈与目录结构

### 核心技术栈
- **前端框架**：Next.js 14 (App Router, RSC, ISR, Edge Runtime)
- **语言**：TypeScript 5 严格模式
- **UI 与样式**：Tailwind CSS 3 + shadcn/ui 组件，支持明暗主题
- **内容处理**：MDX (`@next/mdx`, `rehype-pretty-code`, `remark-gfm`)
- **国际化**：`next-intl`（自定义中间件 + RootLayout 提供上下文）
- **搜索**：MiniSearch 静态索引 + 语雀实时搜索联动
- **通信与外部服务**：Resend 邮件、Upstash RateLimit/Redis、Yuque Open API
- **测试**：Vitest (happy-dom) + Playwright + Lighthouse CI
- **构建工具**：Makefile、Docker、多阶段构建；脚本使用 Node 原生 ES 模块

### 目录结构总览

```text
.
├── app/                         # Next.js App Router（页面、API、静态路由）
│   ├── page.tsx                 # 首页：语雀文章 + 项目精选 + 快捷入口
│   ├── layout.tsx               # Root Layout：主题、i18n、命令面板、CSP nonce
│   ├── head.tsx                 # 自定义 <head> 片段（可扩展 preconnect）
│   ├── not-found.tsx            # 全局 404 文案
│   ├── _offline/                # PWA 离线回退页面（Edge Runtime）
│   ├── about/                   # 关于页（技能云来自项目数据）
│   ├── blog/                    # 语雀文章索引 + 详情（按 namespace 分组）
│   │   ├── page.tsx             # /blog 聚合页（TOC + 默认展开策略）
│   │   └── [login]/[repo]/[slug]/page.tsx  # 语雀文档详情 SSR
│   ├── projects/                # 本地 MDX 项目列表与详情
│   │   ├── page.tsx             # /projects 支持标签/精选筛选
│   │   └── [slug]/              # 动态项目详情、OpenGraph 图片、错误边界
│   ├── tags/                    # 标签索引与标签详情页
│   ├── search/                  # 全站搜索（静态索引 + 语雀实时结果）
│   ├── contact/                 # 联系表单（蜜罐 + 再验证 + Resend）
│   ├── subscribe/               # Newsletter 订阅 & 确认页
│   ├── resume/                  # PDF 友好简历视图 + 打印按钮
│   ├── policies/                # 站点条款与隐私页（可扩展）
│   ├── icons/                   # 动态生成 PWA icons (192/512) 与兜底路由
│   ├── manifest.webmanifest/    # PWA Manifest 动态生成
│   ├── sitemap.xml/route.ts     # 站点地图（页面 + 语雀 + 项目 + 标签）
│   ├── rss.xml/route.ts         # RSS Feed（语雀文章）
│   ├── robots.txt/route.ts      # Robots 文件（按配置生成）
│   ├── opengraph-image/         # 全局 Open Graph 动态图片
│   └── api/                     # App Router API Routes（JSON/Edge/Node）
│       ├── contact/route.ts     # 联系表单提交、限流、邮件通知
│       ├── newsletter/          # 订阅 POST + GET 确认（Token 存 Redis）
│       ├── revalidate/route.ts  # ISR 再验证（可指定 path）
│       ├── search-index/route.ts# 静态搜索索引 JSON（支持 ETag）
│       ├── yuque-search/route.ts# 语雀搜索代理（缓存 60s）
│       └── yuque/...            # /health /toc /toc-raw 调试接口
│
├── src/
│   ├── components/              # UI/站点组件、MDX 适配器、命令面板等
│   │   ├── ui/                  # shadcn/ui 封装（Button/Badge/Dialog...）
│   │   ├── site/                # Header/Footer/主题/搜索/阅读进度/TOC 等
│   │   └── mdx/                 # MDX 专用组件（Callout/Figure/LinkCard...）
│   ├── config/                  # `site.ts`（由 config 脚本生成）
│   ├── lib/                     # 数据层封装
│   │   ├── content.ts           # MDX 内容解析、frontmatter Zod 校验
│   │   ├── yuque.ts             # 语雀 API 客户端与缓存策略
│   │   ├── search.ts            # MiniSearch 工具 & 高亮片段
│   │   ├── resend.ts            # Resend Audience/邮件辅助函数
│   │   └── server/              # 仅服务端工具（限流、请求解析等）
│   ├── i18n/                    # next-intl 配置与多语言文案
│   ├── styles/                  # Tailwind 全局样式
│   ├── test-helpers/            # Vitest/Playwright 共用辅助
│   └── types/                   # 若需扩展可放置全局类型声明
│
├── content/
│   └── projects/                # 本地 MDX 项目（frontmatter 元数据）
│
├── scripts/
│   ├── config.mjs               # 解析 config.yaml → site.ts & .env.local
│   └── sync-projects.mjs        # 调 GitHub API 生成项目 MDX（可选）
│
├── tests/
│   ├── *.test.ts                # Vitest 单测（站点地图、RSS、API、表单...）
│   └── e2e/*.spec.ts            # Playwright 场景测试（命令面板、订阅、搜索等）
│
├── public/                      # 静态资源（icon.svg、图片、PWA 产物缓存）
├── middleware.ts                # 全局中间件：CSP、安全头、Locale 协商
├── Makefile                     # 本地任务编排（中文注释分组）
├── Dockerfile                   # 多阶段构建（Node 20 Alpine）
├── docker-compose.yml           # 单服务 Compose，注入必要 env
├── config.example.yaml          # 配置模板（请复制为 config.yaml 后修改）
├── config.yaml                  # 本地真实配置（勿提交敏感信息）
├── vitest.config.ts             # Vitest 配置（alias/happy-dom）
├── playwright.config.ts         # Playwright 配置（本地 dev / CI build+start）
├── tailwind.config.ts           # Tailwind 主题/插件/扫描范围
├── tsconfig.json                # TypeScript 严格配置与路径别名
└── package.json                 # npm 脚本、依赖、engines
```

---

## 环境准备与体检
- **运行时依赖**：
  - Node.js ≥ 18.17.0（推荐与 CI 一致的 LTS 版本）
  - npm 10.x（或同等 npm-compatible 工具，如 pnpm/yarn，不过 Makefile 默认使用 npm）
  - 可选：Docker/Docker Compose 用于容器化部署
- **系统工具**：`git`, `curl`, `make`, `lsof`（Makefile 某些目标会调用）
- **外部凭据**（按需配置）：
  - Yuque：`YUQUE_TOKEN`, `YUQUE_LOGIN`
  - Resend：`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `RESEND_NEWSLETTER_AUDIENCE_ID`, `NEWSLETTER_FROM`
  - Upstash Redis：`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - GitHub：`GITHUB_TOKEN`（同步项目脚本可选）
- **首次体检**：
  ```bash
  make doctor            # 检查 Node/npm/Playwright 安装，以及 yaml 模块可用性
  make install           # 安装依赖（doctor 若提示缺模块请先执行）
  ```
- **Playwright 浏览器**：
  ```bash
  make pw-install        # 首次使用 E2E 测试前安装浏览器二进制
  ```
- **Node 版本锁定建议**：使用 `fnm`, `nvm` 或 `.tool-versions` 对齐团队版本，避免构建差异。

---

## 配置与生成（config.yaml → site.ts/.env.local）
1. **复制模板并填写**：
   ```bash
   cp config.example.yaml config.yaml
   ```
   - `site.*`：站点名称、描述、作者信息、社交链接、备案等。
   - `site.quickLinks`：首页常用入口列表。
   - `runtime.host/port`：本地开发/工具命令默认 HOST/PORT。
   - `runtime.revalidateSecret`：ISR 再验证密钥（生产请务必使用强随机值）。
   - `runtime.env.*`：外部服务密钥（Resend / Upstash / Yuque / GitHub）。
   - `github.*`：`sync-projects` 脚本的筛选条件（include/exclude/topic）。
2. **生成配置与环境变量**：
   ```bash
   make config
   ```
   - 输出 `src/config/site.ts`（默认导出 `siteConfig` + 兼容命名导出 `site`）。
   - 合并更新 `.env.local`：脚本会读取现有文件并以 `config.yaml` 覆盖同名键。
   - 强制同步的键：
     - `NEXT_PUBLIC_SITE_URL ← site.url`
     - `NEXT_PUBLIC_PLAUSIBLE_DOMAIN ← runtime.plausibleDomain`
     - `REVALIDATE_SECRET ← runtime.revalidateSecret`
   - 配置检查：脚本会针对未配置的 Resend/Upstash 等关键项给出警告但不中断。
3. **查看解析结果**：
   ```bash
   make env
   ```
   输出解析后的 HOST/PORT/SECRET，并提示 `.env.local` 是否存在。
4. **安全注意**：
   - `config.yaml` 不应提交至仓库，真实密钥在部署环境配置。
   - `.env.local` 默认也加入 `.gitignore`，仅本地生效。

---

## 开发与调试（常用工作流）
- **启动开发模式**：
  ```bash
  make dev                # 读取 config.yaml 的 HOST/PORT，可通过 HOST/PORT 覆盖
  make dev HOST=0.0.0.0 PORT=4000
  ```
  - App Router + 热更新；语雀内容实时拉取；命令面板/搜索全功能。
- **预览生产构建**：
  ```bash
  make preview            # 等价于 make build && make start（读取 HOST/PORT）
  ```
- **静态产物调试**：
  ```bash
  make sitemap            # 查看 sitemap.xml
  make rss                # 查看 rss.xml
  make search-index       # 下载搜索索引 JSON
  ```
- **Yuque 诊断工具**：
  ```bash
  make yuque-health       # 健康诊断，可加 QUERY="?deep=1&drafts=1"
  make yuque-search Q=AI  # 搜索语雀文档
  make yuque-toc NS=login/repo
  make yuque-toc-raw NS=login/repo
  ```
- **ISR 刷新**：
  ```bash
  make revalidate REVALIDATE_PATH=/blog
  ```
- **内容同步**（可选 GitHub 项目 → MDX）：
  ```bash
  make sync-projects      # 使用 config.yaml 的 github.* 配置筛选并生成 MDX
  ```
- **端口清理**：
  ```bash
  make stop PORT=3000     # 杀掉指定端口的进程
  make stop-ports         # 清理常用开发端口 3000-3003
  ```

---

## Makefile 目标详解
- **总览**：`make help` 按分类输出所有目标。
- **基础与配置（general/setup）**：
  - `make setup`：安装依赖 + 生成配置（install + config）。
  - `make install` / `make config` / `make env`
  - `make doctor`：检测 Node/npm/yaml/Playwright。
- **开发流程（dev）**：
  - `make dev` / `make build` / `make start` / `make preview`
  - `make analyze`：`ANALYZE=true` 启用包分析。
- **质量保障（quality）**：
  - `make typecheck`、`make lint`、`make lint-fix`
  - `make format`、`make format-check`
  - `make check`：类型 + Lint + 单测组合。
  - `make ci`：类型 + Lint + 单测 + 构建（CI 标准流程）。
  - `make lhci`：运行 Lighthouse CI（一次采集）。
- **测试（test）**：
  - `make test`、`make test-watch`
  - `make e2e`、`make e2e-ui`
  - `make pw-install`
- **内容与集成（content/util）**：
  - `make sync-projects`
  - `make yuque-health/search/toc/toc-raw`
  - `make revalidate`、`make sitemap`、`make rss`、`make search-index`
- **维护工具（maintenance）**：
  - `make clean` / `make clean-all`
  - `make stop` / `make stop-ports`
- **容器（docker）**：
  - `make docker-build` / `make docker-run` / `make docker-stop`
  - `make compose-up` / `make compose-down` / `make compose-restart`

提示：Makefile 中大量命令依赖 `config.yaml` 自动读取 HOST/PORT/SECRET，确保先执行 `make config`。

---

## 内容来源（语雀 + 本地 MDX）
- **语雀内容流**：
  - `src/lib/yuque.ts` 封装鉴权、分页、TOC 构建、搜索代理，默认 10 分钟再验证。
  - `/blog` 页面按 namespace（知识库）分组，可通过 `BLOG_DEFAULT_OPEN_WHITELIST` 调整默认展开。
  - API：`/api/yuque/health`（体检）、`/api/yuque-search`、`/api/yuque/toc`、`/api/yuque/toc-raw`。
  - 搜索：客户端优先使用语雀实时搜索，失败时回退本地 MiniSearch 索引。
- **本地 MDX 项目**：
  - 目录：`content/projects/*.mdx`
  - frontmatter 由 Zod 校验（标题、描述、日期、tech/tags、links）
  - 构建期缓存：`getAllProjects()` 使用 memo，降低文件 I/O。
  - 项目详情页在 RSC 中渲染 MDX，代码高亮由客户端组件 `SyntaxHighlighter` 处理。
- **GitHub README 同步（可选）**：
  - `scripts/sync-projects.mjs` 调用 GitHub API，根据 `config.yaml` 的 include/exclude/topicFilter` 筛选。
  - 自动清理无用 Markdown、转义 HTML 注释、补充 `mailto:` 链接，生成新的 MDX 文件。
- **搜索索引**：
  - `/api/search-index` 聚合语雀文档 + 本地项目，输出 MiniSearch 兼容 JSON。
  - 使用 `ETag` 和 `Cache-Control` 减少重复拉取，`make search-index` 可快速检查。

---

## 测试与质量（Vitest/Playwright/LHCI）
- **Vitest 单测** (`tests/*.test.ts`)：
  - 环境：happy-dom，自动引入 `@testing-library/jest-dom`。
  - 范围：RSS/Sitemap/Robots、Newsletter/Contact API、内容解析、HTML sanitize、middleware 逻辑等。
  - 命令：
    ```bash
    make test              # 一次性运行
    make test-watch        # watch 模式
    ```
- **Playwright E2E** (`tests/e2e/*.spec.ts`)：
  - 场景：命令面板、移动端菜单、搜索联动、订阅确认、项目/简历页面、表单链路等。
  - 配置：本地默认拉起 `npm run dev -p 3001`，CI 走 `npm run build && npm run start -p 3000`。
  - 命令：
    ```bash
    make e2e               # CLI 模式
    make e2e-ui            # 可视化调试
    ```
- **组合检查**：
  ```bash
  make check              # typecheck + lint + test
  make ci                 # + build，CI 使用
  ```
- **性能与可访问性**：
  - `make lhci` 调用 Lighthouse CI（单次采集，可在生产域名运行），建议在 CI/发布前执行。
- **测试准入**：新增或修改路由/逻辑时至少补充对应 Vitest/Playwright 覆盖。

---

## API 路由与页面一览

### 页面（节选）
| 路径 | 描述 | 关键点 |
| --- | --- | --- |
| `/` | 首页 | 语雀文章摘要 + 精选项目 + Quick Links；revalidate 10 分钟 |
| `/blog` | 语雀文章索引 | namespace 分组、TOC 缓存、默认展开控制 |
| `/blog/[login]/[repo]/[slug]` | 文章详情 | SSR 渲染 Markdown → HTML，结构化数据 |
| `/projects` | 项目列表 | 标签筛选、精选过滤、结构化数据 ItemList |
| `/projects/[slug]` | 项目详情 | MDX 渲染、GitHub/Demo 按钮、OpenGraph 图 |
| `/tags` / `/tags/[tag]` | 标签索引 | 来自项目 frontmatter，SEO 友好 |
| `/search` | 全站搜索 | 静态索引 + 语雀搜索、键盘导航、高亮 |
| `/contact` | 联系表单 | 蜜罐、Upstash 限流、Resend 邮件通知 |
| `/subscribe` / `/subscribe/confirm` | Newsletter | 双重确认逻辑、Toast 反馈 |
| `/resume` | 简历 | 打印友好、结构化数据 |
| `/policies` | 协议/隐私占位页 | 可按需扩写 |
| `/_offline` | PWA 离线页 | Edge Runtime 纯静态 |

### API Routes
| 路径 | 方法 | 说明 |
| --- | --- | --- |
| `/api/contact` | POST | 表单校验 + Upstash 限流 + Resend 邮件；缺密钥时降级成功 |
| `/api/newsletter` | POST | 订阅入口：滑动窗口限流、双重确认（Redis token）|
| `/api/newsletter/confirm` | GET | Token 换邮箱 → Resend Audience，成功后删除 Redis 记录 |
| `/api/revalidate` | GET | 触发再验证，需要 `REVALIDATE_SECRET`（生产）|
| `/api/search-index` | GET | MiniSearch 索引 JSON，支持 ETag/304 |
| `/api/yuque-search` | GET | 语雀搜索代理，limit 默认 20 |
| `/api/yuque/health` | GET | 健康探针：环境、namespace 样本、深度统计 |
| `/api/yuque/toc` | GET | TOC 汇总，失败回退解析 toc_yml |
| `/api/yuque/toc-raw` | GET | TOC 原始调试，支持 namespace 或 repoId |

---

## 部署与运维（Docker/Compose）

### Docker Hub 镜像
项目已发布到 Docker Hub，支持多架构（amd64/arm64）：

```bash
# 快速运行（推荐）
docker run -d -p 3000:3000 --name index-home \
  -e NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
  lushi78778/index-home:latest

# 访问应用
open http://localhost:3000
```

**镜像信息**：
- **仓库地址**: [lushi78778/index-home](https://hub.docker.com/r/lushi78778/index-home)
- **镜像大小**: ~178MB（优化后）
- **基础镜像**: Google Distroless（安全、最小化）
- **标签策略**: `latest`、`v1.x.x`、`v1.x`、`v1`

### 环境变量管理
- **本地开发**：使用 `.env.local`
- **生产部署**：通过部署平台（Vercel/Render/Docker）注入
- **关键变量**：Yuque / Resend / Upstash / Plausible / NEXT_PUBLIC_*

### 构建与发布流程
- **自动发布**：推送 `v*` 标签自动触发 GitHub Release + Docker Hub 发布
- **本地构建**：
  ```bash
  make docker-build            # 构建镜像 index-home:latest
  make docker-run              # 后台运行，映射 3000
  make compose-up              # 使用 docker compose up -d
  ```
- **手动发布**：
  ```bash
  # 发布新版本（自动构建 + 推送 Docker 镜像）
  make release TAG=v1.0.3
  ```

### Docker Compose 部署
参考 `docker-compose.yml` 和 `docker/README.md`：
```bash
# 使用预构建镜像
docker-compose up -d

# 本地构建版本
docker-compose -f docker-compose.dev.yml up -d
```
- **Vercel 部署**：
  - 默认兼容；需要在 Settings → Environment Variables 配置 `REVALIDATE_SECRET` 等密钥。
  - 可选开启 `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` 以启用分析脚本。
- **自托管**：
  - 推荐：`npm run build && npm run start -- -H 0.0.0.0 -p 3000`，前置 Nginx/Traefik 做 HTTPS。
  - 健康检查：`/api/yuque/health`, `/sitemap.xml`, `/rss.xml`, `/api/search-index`。
- **日志与监控**：
  - 留意 API 响应头含 `Retry-After`、`X-RateLimit-*` 的限流信息。
  - 使用外部监控（如 UptimeRobot）定期访问 `/api/yuque/health`。

---

## 故障排查 FAQ（含命令示例）
- **博客页为空或 404**：
  - 原因：未配置 `YUQUE_TOKEN` 或语雀知识库非公开。
  - 排查：`make yuque-health` 查看 `env.YUQUE_LOGIN`、`probe.ok`、`sampleNamespaces`。
- **语雀文章缺失/目录不正确**：
  - `make yuque-toc NS=login/repo` 查看 TOC 数量；如 0，再运行 `make yuque-toc NS=... QUERY="?repo=...&by=id"`。
  - 使用 `make yuque-toc-raw` 获取原始 toc_yml，确认语雀端配置。
- **`make config` 未生成 `.env.local`**：
  - 确认 `config.yaml` 是否存在、YAML 缩进是否正确。
  - 脚本输出若警告 `REVALIDATE_SECRET 未设置为生产安全值`，请更新配置后重新执行。
- **联系表单返回 429**：
  - Upstash 限流命中。同一 IP 5 分钟内最多 3 次，响应头含 `Retry-After`。
  - 可在 `config.yaml` 中补齐 Upstash token 或调高阈值（修改代码）。
- **Newsletter 未收到确认邮件**：
  - 检查 `RESEND_API_KEY`、`RESEND_NEWSLETTER_AUDIENCE_ID`、`NEWSLETTER_FROM`。
  - 若未配置 Redis 或 `NEXT_PUBLIC_SITE_URL`，脚本会降级为直接写入（不会发送确认邮件）。
  - 查看 `make yuque-health` 无关，可直接 `curl` 确认 `/api/newsletter` 返回 `ok: true`。
- **Playwright 启动慢或失败**：
  - 首次运行需 `make pw-install`。
  - 若端口被占用，执行 `make stop-ports`。
  - 本地 E2E 默认拉起 dev server（3001），确保无冲突。
- **Docker 构建失败（缺少 config.yaml）**：
  - 构建阶段会执行 `npm run config`，需在镜像构建前将 `config.yaml`（或其安全版本）打包或通过构建时 Secret 提供。
- **PWA 离线页无效**：
  - 开发模式默认禁用 PWA；需 `NODE_ENV=production` 才启用 Service Worker。
  - 检查构建后 `public/sw.js` 是否存在，或运行 `make preview` 并在 Application → Service Workers 查看。

---

## 安全与最佳实践
- **配置管理**：
  - 不要提交真实密钥；`config.yaml` 仅供本地，生产改为环境变量。
  - `REVALIDATE_SECRET` 必须在生产设置为高熵随机字符串。
- **表单安全**：
  - 联系与订阅接口均启用限流、蜜罐与服务端 Zod 校验。
  - 建议在部署平台再配合 WAF/IP Allowlist（如 Cloudflare Rules）。
- **内容安全策略（CSP）**：
  - `middleware.ts` 统一注入 CSP 和安全头，若新增外部脚本需同步更新白名单。
  - Plausible 分析通过 `nonce` 防止内联脚本被阻断。
- **依赖升级**：
  - 使用 `npm outdated` 查看，升级前运行 `make check` + `make e2e`。
  - 关键依赖（Next.js, TypeScript, Playwright）升级需关注 release note。
- **代码风格**：
  - 新增组件遵循 `src/components` 目录结构（UI/站点/MDX 分层）。
  - 文章/项目相关组件可复用 MDX 组件映射，统一外链/图片策略。
- **监控与告警**：
  - 推荐：Plausible、Sentry（可自行集成）、Upstash 监控限流命中情况。
  - 定期检查 `/api/yuque/health?deep=1` 输出中文档数量是否符合预期。

---

## 常用命令速查表（Cheat-Sheet）
```bash
make setup                       # 安装依赖 + 生成配置
make dev                         # 启动开发服务器
make preview                     # 构建并以生产模式启动
make analyze                     # 打包分析
make check                       # 类型 + Lint + 单测
make e2e / make e2e-ui           # Playwright 端到端测试
make lhci                        # Lighthouse CI
make yuque-health                # 语雀健康探针
make yuque-search Q=XXX          # 语雀搜索
make sync-projects               # 同步 GitHub 仓库 README → MDX
make revalidate REVALIDATE_PATH=/blog
make sitemap / make rss / make search-index
make docker-build && make docker-run
make compose-up / make compose-down
make clean / make clean-all      # 清理缓存与 node_modules
```

---

> 如需扩展脚本或工作流，欢迎在 Makefile、`scripts/`、`src/lib/` 中新增模块，保持单一职责并补充测试/文档。遇到问题或优化想法，先运行相关诊断命令并记录输出，可大幅降低排查成本。

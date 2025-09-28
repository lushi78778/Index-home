# Index-home

现代化的个人站点脚手架，基于 **Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui + MDX**，并额外整合了语雀内容仓库。项目的设计目标是“内容集中、配置统一、可观测、可测试”，适合作为博客 / 项目集 / 作品集的长期基线。

> 建议初次接手时完整阅读本说明；文档覆盖了配置、内容来源、常用脚本、测试与部署要点。

---

## 项目亮点

- **双内容源并存**：
  - 语雀开放 API：动态拉取公开知识库、目录、文章详情，并生成知识库索引页、侧边目录树、命令面板搜索。
  - 本地 MDX 项目：用于项目展示，具备 Zod 校验与构建时缓存。
- **全链路自动化**：统一的 `config.yaml` → `make config` 自动生成 `src/config/site.ts` 与 `.env.local`，减少配置漂移；Makefile 提供从开发到部署的日常任务。
- **质量保障**：TypeScript 严格模式、ESLint、Prettier、Vitest、Playwright、Lighthouse；可在 CI 中串联执行。
- **可观测性与安全性**：Upstash 限流、Resend 邮件发送、语雀健康探针、API 接口统一返回结构；默认启用 CSP、表单防刷、双重确认订阅。
- **SEO / 访问体验**：自动生成 sitemap / RSS / JSON-LD / OG 图；命令面板、站内搜索、移动端导航等交互优化。

---

## 技术栈

| 领域      | 选择                                 | 说明                                                            |
| --------- | ------------------------------------ | --------------------------------------------------------------- |
| 框架      | Next.js 14 App Router                | RSC + Edge/Node Route Handlers，ISR 默认 10 分钟                |
| 语言      | TypeScript 5.x                       | `tsconfig.json` 启用严格模式、路径别名                          |
| 样式      | Tailwind CSS 3.x + CSS 变量          | 与 shadcn/ui 组件库协同；自定义 `prose`、暗色主题               |
| 内容      | 语雀 API、MiniSearch、MDX 项目       | 语雀知识库实时拉取；构建期生成静态搜索索引；本地 MDX 仅用于项目 |
| 表单      | `react-hook-form` + `zod`            | 联系表单、订阅表单共享验证逻辑；服务端限流 + Resend 通知        |
| 邮件      | Resend                               | 订阅、联系、双重确认、通知邮件                                  |
| 缓存/限流 | Upstash Redis + Ratelimit            | REST API 防刷、订阅确认 token 存储                              |
| 测试      | Vitest、Testing Library、Playwright  | 单测 + E2E，覆盖内容解析、API、关键页面流                       |
| DevOps    | Makefile、Dockerfile、GitHub Actions | 本地脚本统一管理；CI 可串联类型检查→单测→构建→E2E→Lighthouse    |

---

## 目录速览

```
.
├── app/               # Next.js App Router 路由与 API
│   ├── blog/          # 博客首页（语雀整合）、知识库索引、动态详情页
│   ├── api/           # contact / newsletter / search-index / yuque-* 等接口
│   ├── projects/      # 本地 MDX 项目列表与详情页
│   └── ...
├── src/
│   ├── components/    # 站点级组件、UI 组件、MDX 适配器
│   ├── lib/           # 内容解析、语雀封装、搜索高亮等工具函数
│   ├── config/        # `site.ts`（由脚本生成的站点配置）
│   └── styles/        # 全局样式与 Tailwind 初始化
├── content/           # 本地 MDX 内容（项目）
├── scripts/           # `config.mjs`、`sync-projects.mjs` 等脚本
├── tests/             # Vitest + Playwright 测试
├── Makefile           # 日常任务入口
├── config.yaml        # 站点与运行时集中配置（勿提交真实密钥）
└── config.example.yaml# 配置模板（安全占位符）
```

---

## 快速上手

### 0. 环境要求

- Node.js **≥ 18.17.0**（建议与 `.nvmrc` 或 CI 环境保持一致）
- npm 10.x 或兼容的包管理器（Makefile 默认调用 `npm`）
- 语雀开放 API、Resend、Upstash 等凭据（如需相关功能）

### 1. 配置站点信息

1. 复制模板：`cp config.example.yaml config.yaml`
2. 按需填写：
   - `site`：站点名称、作者信息、社交账号、备案信息等
   - `runtime.host` / `runtime.port`：`make dev` 使用的 HOST/PORT
   - `runtime.env`：邮件、Redis、语雀等密钥（**切勿提交真实值**）。建议只在本地的 `config.yaml` 中维护，或直接写入 `.env.local`。
   - 语雀集成必须提供 `YUQUE_TOKEN`（只读）与 `YUQUE_LOGIN`。

> 生产部署时，请在 CI/平台环境变量中注入相同的键，避免把真实 Token 直接写入仓库。

### 2. 安装依赖并生成配置

```bash
make setup        # 安装依赖并生成配置（等价于 install + config）
# 或按需分步执行：make install / make config
```

### 3. 启动开发服务器

```bash
make dev          # 等价于 npm run dev -- -H <host> -p <port>
```

首轮启动会自动执行 `make config`，确保 TypeScript 与运行时的配置同步。需要查看运行参数时，可随时执行 `make env`。

---

## 配置系统

- **单一来源**：`config.yaml` → `scripts/config.mjs` 输出 `src/config/site.ts`（供应用导入）与 `.env.local`（供 Next 环境变量使用）。
- **优先级**：执行 `make config` 时，`config.yaml` 中的键会覆盖 `.env.local` 的同名键；手动调整 `.env.local` 后需要再次执行 `make config` 以保持一致。
- **敏感信息**：
  - 建议把 `config.yaml` 视为本地文件，不提交真实密钥。
  - 仓库中附带 `config.example.yaml`，在 README 中统一说明需要替换的字段。
- **语雀调试选项**：`runtime.YUQUE_INCLUDE_DRAFTS=true` 可在本地看到草稿文档，上线前务必关闭。

---

## 内容来源与数据流

### 语雀（Yuque）

- 通过 `src/lib/yuque.ts` 封装语雀 REST API：
  - `listAllPublicDocs(login)`：拉取用户/团队所有公开知识库的文档。
  - `listRepoToc(namespace)` + `buildTocTree()`：转换 TOC 为树形结构，支撑知识库索引页与左侧目录树。
  - `getDocDetail(namespace, slug)`：多次回退（namespace → repoId → 列表映射）以提升命中率。
  - `searchYuqueAll(login, q)`：语雀站内搜索，集成到命令面板与 `/api/yuque-search`。
- ISR 默认 10 分钟，可根据需求调整 `export const revalidate`。
- `make yuque-health QUERY='?deep=1&drafts=1'`：调用 `/api/yuque/health` 诊断接口，帮助验证 token、知识库、草稿可见性等。

### 本地 MDX

- `content/projects`：使用 Zod schema 强校验 frontmatter，集中存放项目介绍。
- `src/lib/content.ts`：提供 `getAllProjects` / `getAllTags` 等 API，构建期缓存减少 I/O。

### 搜索索引

- `/api/search-index`：基于语雀文档与本地项目生成静态索引（需要配置 `YUQUE_LOGIN` 才会包含文章）。
- 构建后通过 MiniSearch 在浏览器内实现全文搜索，高亮片段由 `src/lib/search.ts` 提供。

---

## 常用脚本（Makefile）

| 命令                                                                  | 作用                                        |
| --------------------------------------------------------------------- | ------------------------------------------- |
| `make help`                                                           | 按分类列出所有目标                          |
| `make setup` / `make config` / `make env`                             | 安装依赖、生成配置、查看 HOST/PORT/SECRET   |
| `make dev` / `make build` / `make start` / `make preview`             | 开发 / 构建 / 生产启动 / 先构建再启动       |
| `make typecheck` / `make lint` / `make lint-fix` / `make format`      | 质量检查与格式化                            |
| `make check` / `make ci`                                              | 本地质量组合（check）与 CI 流程（额外构建） |
| `make test` / `make test-watch` / `make e2e` / `make e2e-ui`          | Vitest 单测 + Playwright E2E                |
| `make sync-projects`                                                  | 从 GitHub 拉取项目 README 生成 MDX          |
| `make yuque-health` / `make yuque-search Q=关键字`                    | 排查语雀配置、快速搜索公开文档              |
| `make revalidate` / `make sitemap` / `make rss` / `make search-index` | 常用 API/静态产物调试                       |
| `make clean` / `make clean-all` / `make stop` / `make stop-ports`     | 清理构建产物与端口管理                      |
| `make docker-build` / `make docker-run` / `make docker-stop`          | Docker 构建 / 运行 / 清理                   |

> 默认端口、主机、Revalidate Secret 取自 `config.yaml`；可通过环境变量覆盖：`make dev HOST=0.0.0.0 PORT=4000`。

---

## 测试与质量保障

- **Vitest** (`tests/*.test.ts`)：覆盖内容解析、搜索索引、API 等关键逻辑。自定义 `tests/mocks/*` 用于 Resend、`server-only` 等模块替身。
- **Playwright** (`tests/e2e/*.spec.ts`)：覆盖订阅、联系表单、命令面板、移动菜单等核心路径。
- **建议流程**：
  1. 本地迭代：`make dev`
  2. 变更后：`make check`
  3. 覆盖到页面/交互：`make e2e`
  4. 合并或发布前：`npm run lhci`（可在 CI 中运行）
- **CI**：`ci.yml`（如已配置）典型顺序为 `npm ci → make check → npm run build → make e2e → npm run lhci`。

---

## 关键页面路由

| 路径                             | 类型 | 说明                                                                       |
| -------------------------------- | ---- | -------------------------------------------------------------------------- |
| `/`                              | 页面 | 首页：语雀最新文章、精选项目、主行动按钮                                   |
| `/blog`                          | 页面 | 语雀知识库汇总视图（按 namespace 分组，支持展开记忆）                      |
| `/blog/[login]/[repo]`           | 页面 | 单个知识库索引，展示 TOC + 语雀元信息                                      |
| `/blog/[login]/[repo]/[slug]`    | 页面 | 知识库文章详情，支持 HTML / Markdown 渲染、右侧目录                        |
| `/projects` / `/projects/[slug]` | 页面 | 本地 MDX 项目列表与详情                                                    |
| `/subscribe` / `/contact`        | 页面 | 表单 + Resend 邮件 + Upstash 限流                                          |
| `/api/*`                         | 接口 | `newsletter`、`contact`、`search-index`、`yuque-search`、`yuque/health` 等 |

> 语雀集成开启后，旧的 `/blog/[slug]` 路由已移除；`/blog/page/[page]` 会自动重定向到 `/blog`。

---

## 部署与运维

1. **准备环境变量**：确保部署平台注入与 `.env.local` 相同的键值（Resend、Upstash、Yuque、`NEXT_PUBLIC_SITE_URL` 等）。
2. **构建脚本**：在 CI 中加入 `npm run config`，保证最新的 `site.ts` 与 `.env` 合成。
3. **平台建议**：
   - **Vercel**：默认即可运行（Edge + Node Route Handler 混用）。语雀/Resend/Upstash Token 放在项目环境变量里。
   - **自托管**：使用 `make preview` 或 `npm run build && npm run start`；推荐配合 PM2/Supervisor、反向代理、HTTPS。
4. **健康检查**：
   - `/api/yuque/health`：确认语雀凭证、知识库、文档数量是否异常。
   - `/sitemap.xml` / `/rss.xml` / `/api/search-index`：观察是否生成语雀内容。
   - 表单接口在部署后调试一次，确认邮件送达与限流生效。
5. **缓存策略**：默认 ISR 10 分钟，若需要实时更新，可在语雀同步后执行 `make revalidate REVALIDATE_PATH=/blog`。

---

## 常见问题

| 问题                         | 排查路径                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `/blog` 空白或 404           | 检查是否填入 `YUQUE_TOKEN` 与 `YUQUE_LOGIN`；执行 `make yuque-health` 观察返回值                              |
| 语雀文章缺少 HTML / 样式混乱 | 语雀会返回 Markdown 时自动回退到 MDX 渲染；如需保留语雀特有样式，可扩展 `sanitizeHtml` 或在文章内使用内联样式 |
| Tags 页面无文章              | 当启用语雀后，旧的 Markdown 博客标签会被忽略；目前仅统计本地项目标签，属预期行为                              |
| `make config` 提示变量缺失   | `.env.local` 未生成或 `config.yaml` 未填写所需字段；可先创建 `.env.local` 再运行                              |
| 表单接口 429                 | Upstash Ratelimit 命中；依据响应头 `Retry-After` 做用户提示                                                   |

---

## 后续计划建议

- 语雀文档打标签 → `/tags` 支持以知识库 / 标签聚合语雀内容。
- 将 Docker 镜像拆分为多阶段构建（builder + runtime），缩小体积。
- 引入内容变更监控（如 GitHub Action 定时触发 `make revalidate`）。
- 持续补充 Playwright 场景（语雀知识库导航、移动端布局、搜索命中等）。

---

祝你用 Index-home 构建出长期可维护的内容站点，如需扩展欢迎在文档或脚本中保持同样的“配置集中 + 自动验证”理念。

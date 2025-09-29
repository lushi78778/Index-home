# Changelog

All notable changes to this project will be documented in this file.

## v1.0.3 - 2025-09-29

- **工作流整合**: 移除独立的 `docker-publish.yml`，将 Docker 发布整合到 `release.yml`
- **Docker Hub README 同步**: 发布时自动将 `docker/README.md` 同步到 Docker Hub Overview 页面
- **文档完善**: 更新 README 部署部分，添加 Docker Hub 镜像使用说明和快速运行命令
- **发布流程优化**: 推送 `v*` 标签现在同时触发 GitHub Release + Docker Hub 发布 + README 同步

## v1.0.2 - 2025-09-29

- **镜像大小优化**: 从 226MB 减至 178MB（-21%），新增 Distroless 和优化 Alpine 两个版本
- **Docker Hub 自动发布**: 推送 `v*` 标签自动构建多架构镜像（amd64/arm64）并发布到 Docker Hub
- **Dockerfile 重构**: 启用 Next.js standalone 输出、使用 Distroless 基础镜像、完善 OCI 标签和信号处理
- **许可证**: 添加 MIT License 文件和 package.json 许可证字段
- **Makefile 增强**: 新增 `docker-push`、`docker-login` 目标支持本地发布
- **构建选项**: 提供 Distroless（安全）和 Alpine（兼容）两种构建选择

## v1.0.1 - 2025-09-29

- 修复 CI 工作流重复定义（name/on/jobs 重复导致无效）
- CI/Release 在缺少 `config.yaml` 时自动回退使用 `config.example.yaml`
- 新增发布工作流：推送 `v*` 标签自动构建并创建 GitHub Release（附打包产物）

## v1.0.0 - 2025-09-29

- 首次稳定版发布（v1.0.0）
- Next.js 14 App Router 基线，支持 MDX、PWA、next-intl（插件链式集成）
- 完整的内容源：语雀 + 本地 MDX，统一搜索与 RSS/Sitemap 产出
- 完整测试链路：Vitest 单测 + Playwright E2E + Lighthouse CI
- 完善的运维工具：Makefile、Docker、多环境配置生成（config.yaml → site.ts/.env.local）


# Changelog

All notable changes to this project will be documented in this file.

## v1.0.0 - 2025-09-29

- 首次稳定版发布（v1.0.0）
- Next.js 14 App Router 基线，支持 MDX、PWA、next-intl（插件链式集成）
- 完整的内容源：语雀 + 本地 MDX，统一搜索与 RSS/Sitemap 产出
- 完整测试链路：Vitest 单测 + Playwright E2E + Lighthouse CI
- 完善的运维工具：Makefile、Docker、多环境配置生成（config.yaml → site.ts/.env.local）

## v1.0.1 - 2025-09-29

- 修复 CI 工作流重复定义（name/on/jobs 重复导致无效）
- CI/Release 在缺少 `config.yaml` 时自动回退使用 `config.example.yaml`
- 新增发布工作流：推送 `v*` 标签自动构建并创建 GitHub Release（附打包产物）

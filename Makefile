## Makefile（集中式配置版）
# 读取 config.yaml 并生成 src/config/site.ts；所有站点元数据与运行时参数集中在 config.yaml。

NPM ?= npm
NODE ?= node

# 从 config.yaml 读取运行时参数（若 scripts/config.mjs 已将 .env.local 写好，也可直接使用 .env.local）
HOST ?= $(shell awk '/host:/{print $$2; exit}' config.yaml)
PORT ?= $(shell awk '/port:/{print $$2; exit}' config.yaml)
REVALIDATE_PATH ?= /
REVALIDATE_SECRET ?= $(shell awk '/revalidateSecret:/{print $$2; exit}' config.yaml)

.PHONY: help config install dev build start typecheck lint test test-watch format analyze ci clean \
	revalidate sitemap rss search-index

help:
	@echo "可用目标:"
	@echo "  config         - 读取 config.yaml，生成 src/config/site.ts，并更新 .env.local（如需）"
	@echo "  install        - 安装依赖 (npm install)"
	@echo "  dev            - 启动开发服务 (next dev)"
	@echo "  build          - 生产构建 (next build)"
	@echo "  start          - 启动生产服务 (next start)"
	@echo "  typecheck      - TypeScript 类型检查"
	@echo "  lint           - ESLint"
	@echo "  test           - 单元测试 (Vitest)"
	@echo "  test-watch     - 单元测试监听"
	@echo "  format         - Prettier 格式化"
	@echo "  analyze        - 打包分析构建"
	@echo "  ci             - 类型检查 + 测试 + 构建"
	@echo "  clean          - 清理构建产物 (.next, out, dist, .turbo)"
	@echo "  revalidate     - 触发按需 ISR (变量: REVALIDATE_PATH, REVALIDATE_SECRET, HOST, PORT)"
	@echo "  sitemap        - 拉取 sitemap.xml"
	@echo "  rss            - 拉取 rss.xml"
	@echo "  search-index   - 拉取 /api/search-index"

# 生成 TS 配置（每次 dev/build/start 前自动执行，保证与 YAML 同步）
config:
	@echo "→ 生成站点配置 src/config/site.ts（来源 config.yaml）"
	@$(NODE) scripts/config.mjs

install:
	$(NPM) install

dev: config
	$(NPM) run dev

build: config
	$(NPM) run build

start: config
	$(NPM) run start

typecheck:
	$(NPM) run typecheck

lint:
	$(NPM) run lint

format:
	$(NPM) run format

analyze: config
	$(NPM) run analyze

test:
	$(NPM) test

test-watch:
	$(NPM) run test:watch

ci: typecheck test build

clean:
	rm -rf .next out dist .turbo .next/types public/sw.js public/workbox-*.js public/fallback-*.js

revalidate:
	@echo "Revalidating: http://$(HOST):$(PORT)/api/revalidate?path=$(REVALIDATE_PATH)"
	curl -fsS "http://$(HOST):$(PORT)/api/revalidate?path=$(REVALIDATE_PATH)&secret=$(REVALIDATE_SECRET)" || true

sitemap:
	curl -fsS "http://$(HOST):$(PORT)/sitemap.xml" || true

rss:
	curl -fsS "http://$(HOST):$(PORT)/rss.xml" || true

search-index:
	curl -fsS "http://$(HOST):$(PORT)/api/search-index" || true

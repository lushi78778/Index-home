## Index-home 项目任务执行器（Makefile）
## 使用约定：通过 `##@分类 描述` 的形式对目标分组与说明

.DEFAULT_GOAL := help
SHELL := /bin/bash

NPM ?= npm
NODE ?= node

ROOT := $(CURDIR)
CONFIG_FILE := $(ROOT)/config.yaml
ENV_FILE := $(ROOT)/.env.local
CONFIG_SCRIPT := $(NODE) scripts/config.mjs

# --- 配置解析（通过 Node+yaml 稳健读取 config.yaml，不依赖 awk 正则） ---
# 下述变量优先从 config.yaml 读取，缺失时回退到合理默认值
HOST_FROM_YAML := $(shell $(NODE) --input-type=module -e "try{import fs from 'node:fs';import yaml from 'yaml';const d=yaml.parse(fs.readFileSync('config.yaml','utf8'));const v=d?.runtime?.host; if(v!=null) process.stdout.write(String(v));}catch{}" 2>/dev/null)
PORT_FROM_YAML := $(shell $(NODE) --input-type=module -e "try{import fs from 'node:fs';import yaml from 'yaml';const d=yaml.parse(fs.readFileSync('config.yaml','utf8'));const v=d?.runtime?.port; if(v!=null) process.stdout.write(String(v));}catch{}" 2>/dev/null)
SECRET_FROM_YAML := $(shell $(NODE) --input-type=module -e "try{import fs from 'node:fs';import yaml from 'yaml';const d=yaml.parse(fs.readFileSync('config.yaml','utf8'));const v=d?.runtime?.revalidateSecret; if(v!=null) process.stdout.write(String(v));}catch{}" 2>/dev/null)

HOST := $(if $(HOST_FROM_YAML),$(HOST_FROM_YAML),localhost)
PORT := $(if $(PORT_FROM_YAML),$(PORT_FROM_YAML),3000)
REVALIDATE_SECRET := $(if $(SECRET_FROM_YAML),$(SECRET_FROM_YAML),dev-secret)
REVALIDATE_PATH ?= /

curl_endpoint = @curl -fsS "http://$(HOST):$(PORT)$(1)"

.PHONY: help setup install config env dev build start preview typecheck lint lint-fix format format-check test test-watch e2e e2e-ui check ci lhci analyze clean clean-all sync-projects yuque-health yuque-search yuque-toc yuque-toc-raw revalidate sitemap rss search-index stop stop-ports docker-build docker-run docker-stop compose-up compose-down compose-restart pw-install doctor release tag push-tags changelog

help: ##@general 显示分组后的帮助信息
	@printf "用法: make <目标>\n"
	@awk 'BEGIN {FS=":.*##@"; last=""} /^[a-zA-Z0-9_-]+:.*##@/ {match($$2, /^[^ ]+/); cat=substr($$2, RSTART, RLENGTH); desc=substr($$2, RLENGTH+2); if (cat != last) {last=cat; printf "\n[%s]\n", toupper(cat)} printf "  %-18s %s\n", $$1, desc}' $(MAKEFILE_LIST)

setup: install config ##@general 安装依赖并生成配置

install: ##@setup 安装 npm 依赖
	$(NPM) install

config: ##@setup 读取 config.yaml 生成 src/config/site.ts 并合并 .env.local
	@$(CONFIG_SCRIPT)

env: ##@setup 打印解析后的 HOST/PORT/SECRET 等信息
	@echo HOST=$(HOST)
	@echo PORT=$(PORT)
	@echo REVALIDATE_SECRET=$(REVALIDATE_SECRET)
	@if [ -f $(ENV_FILE) ]; then echo "— 已存在 .env.local"; else echo "— 未找到 .env.local（可执行: make config）"; fi

# --- Development lifecycle --------------------------------------------------

dev: config ##@dev 启动 Next.js 开发服务器
	$(NPM) run dev -- -H $(HOST) -p $(PORT)

build: config ##@dev 构建生产产物
	$(NPM) run build

start: config ##@dev 启动生产服务器（需先构建）
	$(NPM) run start -- -H $(HOST) -p $(PORT)

preview: build ##@dev 先构建后以生产模式启动
	$(NPM) run start -- -H $(HOST) -p $(PORT)

analyze: ##@dev 开启打包分析构建（ANALYZE=true）
	$(NPM) run analyze

# --- Code quality -----------------------------------------------------------

typecheck: ##@quality TypeScript 类型检查
	$(NPM) run typecheck

lint: ##@quality 运行 ESLint
	$(NPM) run lint

lint-fix: ##@quality 运行 ESLint 并自动修复
	$(NPM) run lint -- --fix

format: ##@quality 使用 Prettier 格式化代码
	$(NPM) run format

format-check: ##@quality 使用 Prettier 检查格式
	$(NPM) exec prettier --check .

check: ##@quality 本地质量组合：类型检查 + Lint + 单元测试
	$(MAKE) typecheck
	$(MAKE) lint
	$(MAKE) test

ci: ##@quality CI 流程：类型检查 + Lint + 测试 + 构建
	$(MAKE) typecheck
	$(MAKE) lint
	$(MAKE) test
	$(MAKE) build

lhci: ##@quality 运行 Lighthouse CI（单次采集）
	$(NPM) run lhci

# --- Testing ----------------------------------------------------------------

test: ##@test 运行 Vitest 单元测试
	$(NPM) test

test-watch: ##@test 以 watch 模式运行 Vitest
	$(NPM) run test:watch

e2e: ##@test 运行 Playwright 端到端测试
	$(NPM) run e2e

e2e-ui: ##@test 打开 Playwright UI 运行器
	$(NPM) run e2e:ui

pw-install: ##@test 安装 Playwright 浏览器依赖（首次运行前执行）
	$(NPM) exec playwright install

# --- Content & integrations -------------------------------------------------

sync-projects: ##@content 同步 GitHub 仓库生成 content/projects 下的 MDX
	$(NPM) run sync:projects

yuque-health: ##@content 调用语雀健康探针（可通过 QUERY="?..." 追加查询参数）
	$(call curl_endpoint,/api/yuque/health$(QUERY))

yuque-search: ##@content 调用语雀搜索接口（传入 Q=关键字）
	@if [ -z "$(Q)" ]; then echo "Usage: make yuque-search Q=keyword" && exit 1; fi
	$(call curl_endpoint,/api/yuque-search?q=$(Q))

yuque-toc: ##@content 语雀 TOC 汇总（传入 NS=login/repo）
	@if [ -z "$(NS)" ]; then echo "Usage: make yuque-toc NS=login/repo" && exit 1; fi
	$(call curl_endpoint,/api/yuque/toc?repo=$(NS))

yuque-toc-raw: ##@content 语雀原始 TOC 代理（传入 NS=login/repo）
	@if [ -z "$(NS)" ]; then echo "Usage: make yuque-toc-raw NS=login/repo" && exit 1; fi
	$(call curl_endpoint,/api/yuque/toc-raw?repo=$(NS))

# --- Site utilities ---------------------------------------------------------

revalidate: ##@util 触发增量静态再生成（传入 REVALIDATE_PATH=/foo）
	@echo "→ Revalidating http://$(HOST):$(PORT)/api/revalidate?path=$(REVALIDATE_PATH)"
	$(call curl_endpoint,/api/revalidate?path=$(REVALIDATE_PATH)&secret=$(REVALIDATE_SECRET))

sitemap: ##@util 访问并下载 sitemap.xml
	$(call curl_endpoint,/sitemap.xml)

rss: ##@util 访问并下载 rss.xml
	$(call curl_endpoint,/rss.xml)

search-index: ##@util 拉取静态搜索索引 JSON
	$(call curl_endpoint,/api/search-index)

# --- Maintenance ------------------------------------------------------------

clean: ##@maintenance 清理构建缓存与报告
	rm -rf .next out dist .turbo .next/types public/sw.js public/workbox-*.js public/fallback-*.js playwright-report test-results

clean-all: clean ##@maintenance 进一步清理 node_modules
	rm -rf node_modules

stop: ##@maintenance 结束占用当前端口（PORT）的进程
	@PID=$$(lsof -ti tcp:$(PORT) || true); \
	if [ -n "$$PID" ]; then \
		echo "结束进程: $$PID（端口 $(PORT)）"; \
		kill $$PID 2>/dev/null || true; \
		sleep 1; \
		PID2=$$(lsof -ti tcp:$(PORT) || true); \
		if [ -n "$$PID2" ]; then kill -9 $$PID2 2>/dev/null || true; fi; \
	else \
		echo "端口 $(PORT) 上没有监听进程"; \
	fi

stop-ports: ##@maintenance 批量结束常见开发端口（3000-3003）上的进程
	@for p in 3000 3001 3002 3003; do \
	  PID=$$(lsof -ti tcp:$$p || true); \
	  if [ -n "$$PID" ]; then \
	    echo "结束进程: $$PID（端口 $$p）"; \
	    kill $$PID 2>/dev/null || true; \
	    sleep 1; \
	    PID2=$$(lsof -ti tcp:$$p || true); \
	    if [ -n "$$PID2" ]; then kill -9 $$PID2 2>/dev/null || true; fi; \
	  else \
	    echo "端口 $$p 上没有监听进程"; \
	  fi; \
	done

doctor: ##@maintenance 快速检查本地环境（Node、npm、yaml、Playwright）
	@printf "Node:  "; node -v 2>/dev/null || echo missing; \
	printf "npm:   "; npm -v 2>/dev/null || echo missing; \
	printf "yaml:  "; node --input-type=module -e "import('yaml').then(()=>process.stdout.write('ok')).catch(()=>process.stdout.write('missing'))" 2>/dev/null || true; echo; \
	printf "Playwright: "; npx --yes playwright --version 2>/dev/null || echo missing

# --- Release ---------------------------------------------------------------

VERSION ?= $(shell node -p "require('./package.json').version")
TAG ?= v$(VERSION)

changelog: ##@release 生成简单的 CHANGELOG.md（追加顶部）
	@{ \
	  echo "# Changelog"; \
	  echo ""; \
	  if [ -f CHANGELOG.md ]; then sed '1,/^$/d' CHANGELOG.md || true; fi; \
	} > CHANGELOG.new.md
	@mv CHANGELOG.new.md CHANGELOG.md
	@echo "→ CHANGELOG.md 更新完成"

tag: ##@release 按 package.json 版本创建 git 标签（TAG 可覆盖）
	@git tag -a $(TAG) -m "Release $(TAG)" || { echo "标签已存在或创建失败：$(TAG)"; exit 1; }
	@echo "→ 已创建标签 $(TAG)"

push-tags: ##@release 推送标签到远端
	@git push --tags
	@echo "→ 已推送标签到远端"

release: ci tag push-tags ##@release 运行本地 CI 任务并创建/推送标签
	@echo "→ 本地检查通过，已创建并推送标签 $(TAG)；GitHub Actions 将触发 release 工作流"

# --- Docker -----------------------------------------------------------------

docker-build: ##@docker 构建 Docker 镜像（tag: index-home:latest）
	docker build -t index-home:latest .

docker-run: ##@docker 运行镜像并映射到本机 3000 端口
	docker run --rm -d -p 3000:3000 --name index-home index-home:latest

docker-stop: ##@docker 停止并移除运行中的容器
	-@docker rm -f index-home >/dev/null 2>&1 || true

compose-up: ##@docker 使用 docker-compose.yml 启动服务
	docker compose up -d

compose-down: ##@docker 停止并清理 docker compose 相关资源
	docker compose down

compose-restart: ##@docker 通过 docker compose 重启服务
	docker compose restart

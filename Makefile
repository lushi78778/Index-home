# Task runner for the Index-home project
# Targets are grouped by category via the `##@category Description` convention.

.DEFAULT_GOAL := help
SHELL := /bin/bash

NPM ?= npm
NODE ?= node

ROOT := $(CURDIR)
CONFIG_FILE := $(ROOT)/config.yaml
ENV_FILE := $(ROOT)/.env.local
CONFIG_SCRIPT := $(NODE) scripts/config.mjs

HOST_RAW := $(shell awk '/host:/{print $$2; exit}' $(CONFIG_FILE) 2>/dev/null)
PORT_RAW := $(shell awk '/port:/{print $$2; exit}' $(CONFIG_FILE) 2>/dev/null)
REVALIDATE_SECRET_RAW := $(shell awk '/revalidateSecret:/{print $$2; exit}' $(CONFIG_FILE) 2>/dev/null)

HOST ?= $(if $(HOST_RAW),$(HOST_RAW),localhost)
PORT ?= $(if $(PORT_RAW),$(PORT_RAW),3000)
REVALIDATE_SECRET ?= $(if $(REVALIDATE_SECRET_RAW),$(REVALIDATE_SECRET_RAW),dev-secret)
REVALIDATE_PATH ?= /

curl_endpoint = @curl -fsS "http://$(HOST):$(PORT)$(1)"

.PHONY: help setup install config env dev build start preview typecheck lint lint-fix format format-check test test-watch e2e e2e-ui check ci clean clean-all sync-projects yuque-health yuque-search revalidate sitemap rss search-index stop stop-ports docker-build docker-run docker-stop

help: ##@general Show this help text with grouped targets
	@printf "Usage: make <target>\n"
	@awk 'BEGIN {FS=":.*##@"; last=""} /^[a-zA-Z0-9_-]+:.*##@/ {match($$2, /^[^ ]+/); cat=substr($$2, RSTART, RLENGTH); desc=substr($$2, RLENGTH+2); if (cat != last) {last=cat; printf "\n[%s]\n", toupper(cat)} printf "  %-18s %s\n", $$1, desc}' $(MAKEFILE_LIST)

setup: install config ##@general Install dependencies and generate config

install: ##@setup Install npm dependencies
	$(NPM) install

config: ##@setup Generate src/config/site.ts and sync .env.local
	@$(CONFIG_SCRIPT)

env: ##@setup Print resolved HOST/PORT/SECRET values
	@echo HOST=$(HOST)
	@echo PORT=$(PORT)
	@echo REVALIDATE_SECRET=$(REVALIDATE_SECRET)

# --- Development lifecycle --------------------------------------------------

dev: config ##@dev Start the Next.js dev server
	$(NPM) run dev -- -H $(HOST) -p $(PORT)

build: config ##@dev Build the production bundle
	$(NPM) run build

start: config ##@dev Start Next.js in production mode (requires build)
	$(NPM) run start -- -H $(HOST) -p $(PORT)

preview: build ##@dev Build then start the production server
	$(NPM) run start -- -H $(HOST) -p $(PORT)

# --- Code quality -----------------------------------------------------------

typecheck: ##@quality TypeScript type check
	$(NPM) run typecheck

lint: ##@quality Run ESLint
	$(NPM) run lint

lint-fix: ##@quality Run ESLint with --fix
	$(NPM) run lint -- --fix

format: ##@quality Format with Prettier
	$(NPM) run format

format-check: ##@quality Check formatting with Prettier
	$(NPM) exec prettier --check .

check: ##@quality Run typecheck + lint + unit tests
	$(MAKE) typecheck
	$(MAKE) lint
	$(MAKE) test

ci: ##@quality CI pipeline (typecheck + lint + tests + build)
	$(MAKE) typecheck
	$(MAKE) lint
	$(MAKE) test
	$(MAKE) build

# --- Testing ----------------------------------------------------------------

test: ##@test Run Vitest suite
	$(NPM) test

test-watch: ##@test Run Vitest in watch mode
	$(NPM) run test:watch

e2e: ##@test Run Playwright end-to-end tests
	$(NPM) run e2e

e2e-ui: ##@test Open Playwright UI runner
	$(NPM) run e2e:ui

# --- Content & integrations -------------------------------------------------

sync-projects: ##@content Sync GitHub repositories into content/projects
	$(NPM) run sync:projects

yuque-health: ##@content Call the Yuque health probe (pass QUERY="?..." to customise)
	$(call curl_endpoint,/api/yuque/health$(QUERY))

yuque-search: ##@content Call the Yuque search endpoint (Q=keyword)
	@if [ -z "$(Q)" ]; then echo "Usage: make yuque-search Q=keyword" && exit 1; fi
	$(call curl_endpoint,/api/yuque-search?q=$(Q))

# --- Site utilities ---------------------------------------------------------

revalidate: ##@util Trigger incremental static regeneration (REVALIDATE_PATH=/foo)
	@echo "→ Revalidating http://$(HOST):$(PORT)/api/revalidate?path=$(REVALIDATE_PATH)"
	$(call curl_endpoint,/api/revalidate?path=$(REVALIDATE_PATH)&secret=$(REVALIDATE_SECRET))

sitemap: ##@util Download the generated sitemap.xml
	$(call curl_endpoint,/sitemap.xml)

rss: ##@util Download rss.xml
	$(call curl_endpoint,/rss.xml)

search-index: ##@util Fetch the static search index JSON
	$(call curl_endpoint,/api/search-index)

# --- Maintenance ------------------------------------------------------------

clean: ##@maintenance Remove build caches and reports
	rm -rf .next out dist .turbo .next/types public/sw.js public/workbox-*.js public/fallback-*.js playwright-report test-results

clean-all: clean ##@maintenance Remove build artefacts and node_modules
	rm -rf node_modules

stop: ##@maintenance Kill the process bound to PORT
	@PID=$$(lsof -ti tcp:$(PORT) || true); \
	if [ -n "$$PID" ]; then \
		echo "Killing PID(s): $$PID on port $(PORT)"; \
		kill $$PID 2>/dev/null || true; \
		sleep 1; \
		PID2=$$(lsof -ti tcp:$(PORT) || true); \
		if [ -n "$$PID2" ]; then kill -9 $$PID2 2>/dev/null || true; fi; \
	else \
		echo "No process listening on port $(PORT)"; \
	fi

stop-ports: ##@maintenance Force kill common dev ports (3000-3003)
	@for p in 3000 3001 3002 3003; do \
	  PID=$$(lsof -ti tcp:$$p || true); \
	  if [ -n "$$PID" ]; then \
	    echo "Killing PID(s): $$PID on port $$p"; \
	    kill $$PID 2>/dev/null || true; \
	    sleep 1; \
	    PID2=$$(lsof -ti tcp:$$p || true); \
	    if [ -n "$$PID2" ]; then kill -9 $$PID2 2>/dev/null || true; fi; \
	  else \
	    echo "No process listening on port $$p"; \
	  fi; \
	done

# --- Docker -----------------------------------------------------------------

docker-build: ##@docker Build the Docker image (tag: index-home:latest)
	docker build -t index-home:latest .

docker-run: ##@docker Run the Docker image on port 3000
	docker run --rm -d -p 3000:3000 --name index-home index-home:latest

docker-stop: ##@docker Stop and remove the running Docker container
	-@docker rm -f index-home >/dev/null 2>&1 || true

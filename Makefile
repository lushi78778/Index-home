# Makefile for Index-home (Next.js + TS + Tailwind + MDX)
# Use GNU Make. On Windows, use Git Bash/MSYS2/Cygwin or WSL.

# Configurable variables (can be overridden: make dev PORT=3000)
NPM ?= npm
HOST ?= localhost
PORT ?= 3000
REVALIDATE_PATH ?= /
REVALIDATE_SECRET ?= $(REVALIDATE_SECRET)

.PHONY: help install dev build start typecheck lint test test-watch format analyze ci clean \
	revalidate sitemap rss search-index

help:
	@echo "Available targets:"
	@echo "  install        - Install dependencies (npm install)"
	@echo "  dev            - Start Next.js dev server"
	@echo "  build          - Build production bundle"
	@echo "  start          - Start production server"
	@echo "  typecheck      - Run TypeScript type checking"
	@echo "  lint           - Run ESLint"
	@echo "  test           - Run unit tests (Vitest)"
	@echo "  test-watch     - Run unit tests in watch mode"
	@echo "  format         - Format code with Prettier"
	@echo "  analyze        - Build with bundle analyzer (if configured)"
	@echo "  ci             - Typecheck, test, then build"
	@echo "  clean          - Remove build artifacts (.next, out, dist, .turbo)"
	@echo "  revalidate     - Trigger on-demand ISR (vars: REVALIDATE_PATH, REVALIDATE_SECRET, HOST, PORT)"
	@echo "  sitemap        - Fetch sitemap.xml"
	@echo "  rss            - Fetch rss.xml"
	@echo "  search-index   - Fetch /api/search-index"

install:
	$(NPM) install

dev:
	$(NPM) run dev

build:
	$(NPM) run build

start:
	$(NPM) run start

typecheck:
	$(NPM) run typecheck

lint:
	$(NPM) run lint

format:
	$(NPM) run format

analyze:
	$(NPM) run analyze

test:
	$(NPM) test

test-watch:
	$(NPM) run test:watch

ci: typecheck test build

clean:
	rm -rf .next out dist .turbo

revalidate:
	@echo "Revalidating: http://$(HOST):$(PORT)/api/revalidate?path=$(REVALIDATE_PATH)"
	curl -fsS "http://$(HOST):$(PORT)/api/revalidate?path=$(REVALIDATE_PATH)&secret=$(REVALIDATE_SECRET)" || true

sitemap:
	curl -fsS "http://$(HOST):$(PORT)/sitemap.xml" || true

rss:
	curl -fsS "http://$(HOST):$(PORT)/rss.xml" || true

search-index:
	curl -fsS "http://$(HOST):$(PORT)/api/search-index" || true

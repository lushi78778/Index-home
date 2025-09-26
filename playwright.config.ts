import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  // 放宽断言等待时间，避免开发模式首次编译/流式渲染导致的短暂抖动
  expect: { timeout: 15_000 },
  // 本地降低并发，避免 Next dev 首次命中多路由时的编译竞争
  fullyParallel: false,
  workers: process.env.CI ? undefined : 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ||
      (process.env.CI ? 'http://localhost:3000' : 'http://localhost:3001'),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: { 'Accept-Language': 'zh-CN,zh;q=0.9' },
    viewport: { width: 1280, height: 800 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // 自动启动 Next.js 服务器：CI 使用 build+start，本地使用 dev
  webServer: process.env.CI
    ? {
        command: 'npm run build && npm run start -- -p 3000',
        url: 'http://localhost:3000',
        reuseExistingServer: false,
        timeout: 180_000,
      }
    : {
        command: 'npm run dev -- -p 3001',
        url: 'http://localhost:3001',
        reuseExistingServer: true,
        timeout: 120_000,
      },
})

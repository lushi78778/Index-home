import { test, expect } from '@playwright/test'

// 模拟接口：拦截 API 请求并返回成功响应
async function mockNewsletterSuccess(page: import('@playwright/test').Page) {
  await page.route('**/api/newsletter', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    })
  })
}

async function mockContactSuccess(page: import('@playwright/test').Page) {
  await page.route('**/api/contact', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    })
  })
}

test('subscribe form submits and shows toast', async ({ page }) => {
  await mockNewsletterSuccess(page)
  await page.goto('/subscribe')
  await page.locator('input[name="email"]').fill('user@example.com')
  await page.getByRole('button', { name: '订阅' }).click()
  // 断言提示条展示成功文案
  await expect(page.locator('div[role="status"]')).toContainText('订阅成功')
})

test('contact form submits and shows toast', async ({ page }) => {
  await mockContactSuccess(page)
  await page.goto('/contact')
  await page.locator('input[name="name"]').fill('张三')
  await page.locator('input[name="email"]').fill('user@example.com')
  await page.locator('textarea[name="message"]').fill('这是测试消息，至少十个字符。')
  await page.getByRole('button', { name: '发送' }).click()
  await expect(page.locator('div[role="status"]')).toContainText('提交成功')
})

import { test, expect } from '@playwright/test'

test('newsletter confirm shows success message', async ({ page }) => {
  await page.route('**/api/newsletter/confirm?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    })
  })
  await page.goto('/subscribe/confirm?token=abc')
  await expect(page.getByRole('status')).toContainText('订阅已确认')
})

test('newsletter confirm shows error when API fails', async ({ page }) => {
  await page.route('**/api/newsletter/confirm?**', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false }),
    })
  })
  await page.goto('/subscribe/confirm?token=bad')
  await expect(page.getByRole('status')).toContainText('无效或已过期')
})

import { test, expect } from '@playwright/test'

test('home → blog → post smoke + a11y (basic)', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('main')).toBeVisible()
  // 使用可访问性树的最小无障碍校验信号（在严格 CSP 下可用）
  const homeAX = await page.accessibility.snapshot({ interestingOnly: true })
  expect(homeAX).toBeTruthy()
  expect(
    Array.isArray((homeAX as any).children) && ((homeAX as any).children?.length ?? 0) >= 1,
  ).toBeTruthy()

  await page.goto('/blog')
  await expect(page.locator('h1, h2').filter({ hasText: /博客|Blog/i })).toBeVisible()
  const blogAX = await page.accessibility.snapshot({ interestingOnly: true })
  expect(blogAX?.name ?? '').not.toMatch(/error/i)

  const firstPost = page.locator('a[href^="/blog/"]').first()
  await expect(firstPost).toBeVisible()
  await Promise.all([page.waitForURL((url) => /\/blog\//.test(url.pathname)), firstPost.click()])
  await expect(page.locator('article')).toBeVisible()
  const postAX = await page.accessibility.snapshot({ interestingOnly: true })
  expect(postAX?.name ?? '').not.toMatch(/error/i)
})

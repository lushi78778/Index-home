import { test, expect } from '@playwright/test'

test('home → blog → post smoke + a11y (basic)', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('main')).toBeVisible()
  // minimal a11y signal using Accessibility Tree (works under strict CSP)
  const homeAX = await page.accessibility.snapshot({ interestingOnly: true })
  expect(homeAX).toBeTruthy()
  expect(
    Array.isArray((homeAX as any).children) && ((homeAX as any).children?.length ?? 0) >= 1,
  ).toBeTruthy()

  await page.goto('/blog')
  await expect(page.locator('h1, h2').filter({ hasText: /博客|Blog/i })).toBeVisible()
  const blogAX = await page.accessibility.snapshot({ interestingOnly: true })
  expect(blogAX?.name ?? '').not.toMatch(/error/i)

  const firstPost = page.locator('ul li a[href^="/blog/"]').first()
  await expect(firstPost).toBeVisible()
  await Promise.all([page.waitForURL(/\/blog\/[\w-]+$/), firstPost.click()])
  await expect(page.locator('article')).toBeVisible()
  const postAX = await page.accessibility.snapshot({ interestingOnly: true })
  expect(postAX?.name ?? '').not.toMatch(/error/i)
})

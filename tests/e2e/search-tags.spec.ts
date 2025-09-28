import { test, expect } from '@playwright/test'

test('search returns results and navigates to first result', async ({ page }) => {
  await page.goto('/search')
  const input = page.locator('input[placeholder="搜索文章或项目…"]')
  await expect(input).toBeVisible()
  await input.fill('hello')
  // there should be at least one result linking to blog or projects
  const first = page.locator('ul li a').first()
  await expect(first).toBeVisible()
  const href = await first.getAttribute('href')
  await Promise.all([
    href?.startsWith('/blog/') ? page.waitForURL(/\/blog\//) : page.waitForURL(/\/projects\//),
    first.click(),
  ])
  // prioritize article, fallback to single h1
  const article = page.locator('article')
  if (await article.count()) {
    await expect(article.first()).toBeVisible()
  } else {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
})

test('tags index lists tags and tag page shows items', async ({ page }) => {
  await page.goto('/tags')
  const tagLink = page.locator('a[href^="/tags/"]').first()
  await expect(tagLink).toBeVisible()
  await Promise.all([page.waitForURL(/\/tags\//), tagLink.click()])
  // Tag page should show the project section heading
  await expect(page.getByRole('heading', { name: /项目/ })).toBeVisible()
  // presence of at least one project item or the empty state message
  const anyItem = page.locator('ul li a[href^="/projects/"]').first()
  const empty = page.getByText('暂无项目。')
  await expect.any([anyItem, empty])
})

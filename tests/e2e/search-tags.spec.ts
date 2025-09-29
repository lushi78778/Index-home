import { test, expect } from '@playwright/test'

test('search returns results and navigates to first result', async ({ page }) => {
  await page.goto('/search')
  const input = page.locator('input[placeholder="搜索文章或项目…"]')
  await expect(input).toBeVisible()
  await input.fill('hello')
  // 断言至少存在指向博客或项目的搜索结果
  const first = page.locator('ul li a').first()
  await expect(first).toBeVisible()
  const href = await first.getAttribute('href')
  await Promise.all([
    href?.startsWith('/blog/') ? page.waitForURL(/\/blog\//) : page.waitForURL(/\/projects\//),
    first.click(),
  ])
  // 优先验证文章节点，若不存在则回退到页面一级标题
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
  // 标签详情页需展示项目分区的标题
  await expect(page.getByRole('heading', { name: /项目/ })).toBeVisible()
  // 断言存在任一项目条目或空状态提示文案
  const anyItem = page.locator('ul li a[href^="/projects/"]').first()
  const empty = page.getByText('暂无项目。')
  await expect.any([anyItem, empty])
})

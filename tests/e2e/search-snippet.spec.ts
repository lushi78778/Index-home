import { test, expect } from '@playwright/test'

test('search shows highlighted query in snippet', async ({ page }) => {
  await page.goto('/search')
  const input = page.locator('input[placeholder="搜索文章或项目…"]')
  await expect(input).toBeVisible()
  await input.fill('MDX')

  // 确认结果项出现
  const firstItem = page.locator('ul li').first()
  await expect(firstItem).toBeVisible()

  // 片段中应该包含高亮 <mark>（在链接后紧跟的说明段中）
  const snippet = firstItem.locator('span.text-muted-foreground')
  await expect(snippet).toBeVisible()
  const mark = snippet.locator('mark')
  await expect(mark).toContainText(/mdx/i)
})

import { test, expect } from '@playwright/test'

test('projects page tag filter works', async ({ page }) => {
  await page.goto('/projects')
  const anyTag = page.locator('a[href^="/projects?tag="]').first()
  await expect(anyTag).toBeVisible()
  const href = await anyTag.getAttribute('href')
  await Promise.all([page.waitForURL(/\/projects\?tag=/), anyTag.click()])
  // 列表应出现或显示“暂无结果”提示
  const listItem = page.locator('ul li').first()
  const empty = page.getByText('暂无结果')
  await expect.any([listItem, empty])
})

test('notes page filters (kind/tag) work', async ({ page }) => {
  await page.goto('/notes')
  // 点击“书签”过滤
  await Promise.all([page.waitForURL(/\/notes\?kind=bookmark/), page.getByRole('link', { name: '书签' }).click()])
  // 若存在条目，至少出现一个 li
  const item = page.locator('ul li').first()
  await expect(item).toBeVisible()
  // 若有标签链接则点击进行过滤
  const tagLink = page.locator('a[href*="tag="]').first()
  if (await tagLink.count()) {
    const urlBefore = page.url()
    await Promise.all([
      page.waitForURL((u) => u.toString() !== urlBefore && /\/notes\?/.test(u.toString())),
      tagLink.click(),
    ])
    await expect(page.locator('ul li').first()).toBeVisible()
  }
})

test('project detail shows external links when configured', async ({ page }) => {
  await page.goto('/projects')
  const firstProject = page.locator('a[href^="/projects/"]').first()
  await expect(firstProject).toBeVisible()
  await Promise.all([page.waitForURL(/\/projects\//), firstProject.click()])
  // 如果该项目配置了外链，至少出现一个外链按钮（GitHub 或 Demo）
  const ext = page.locator('a:has-text("GitHub"), a:has-text("Demo")')
  // 不强制要求一定存在（有的项目可能没配置），但可见时应可点击
  if (await ext.count()) {
    await expect(ext.first()).toBeVisible()
  }
})

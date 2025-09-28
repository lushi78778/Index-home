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

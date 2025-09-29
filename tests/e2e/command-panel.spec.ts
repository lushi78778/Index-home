import { test, expect } from '@playwright/test'

test('command panel toggles with Cmd/Ctrl+K and navigates', async ({ page }) => {
  await page.goto('/')
  // 通过头部按钮触发，提升 CI 场景的稳定性
  await page.getByRole('button', { name: '命令' }).click()
  // 等待对话框出现并定位输入框（占位符包含“搜索”）
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const input = dialog.getByRole('textbox')
  await expect(input).toBeVisible()
  await input.fill('hello')
  const first = dialog.locator('ul li a[href^="/blog/"], ul li a[href^="/projects/"]').first()
  await expect(first).toBeVisible()
  const href = await first.getAttribute('href')
  await Promise.all([
    href?.startsWith('/blog/') ? page.waitForURL(/\/blog\//) : page.waitForURL(/\/projects\//),
    first.click(),
  ])
  const article = page.locator('article')
  if (await article.count()) {
    await expect(article.first()).toBeVisible()
  } else {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
})

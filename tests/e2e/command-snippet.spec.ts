import { test, expect } from '@playwright/test'

test('command palette shows highlighted snippet for query', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '命令' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const input = dialog.getByRole('textbox')
  await expect(input).toBeVisible()
  await input.fill('MDX')

  const mark = dialog.locator('ul li mark')
  await expect(mark.first()).toHaveText(/mdx/i)
})

import { test, expect } from '@playwright/test'

test('resume page renders and shows print button', async ({ page }) => {
  await page.goto('/resume')
  // 标题包含作者名
  const heading = page.getByRole('heading', { level: 1 })
  await expect(heading).toBeVisible()
  // 打印/保存按钮存在
  const printBtn = page.getByRole('button', { name: /打印\s*\/\s*保存为\s*PDF/ })
  await expect(printBtn).toBeVisible()
})

import { test, expect } from '@playwright/test'

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

test.describe('Related posts', () => {
  test('shows related list and navigates', async ({ page }) => {
    await page.goto(`${base}/blog/writing-with-mdx-components`)
    // 相关推荐区域
    const section = page.getByRole('region', { name: '相关推荐' })
    // 如果没有显式的 role/aria-label，则改用标题定位
    const title = page.getByText('相关推荐', { exact: true })
    await expect(title).toBeVisible()

    // 点击第一条链接（若存在）
    const firstLink = page.locator('section:has-text("相关推荐") a').first()
    if (await firstLink.count()) {
      const href = await firstLink.getAttribute('href')
      await firstLink.click()
      if (href) await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    }
  })
})

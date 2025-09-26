import { test, expect } from '@playwright/test'

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

test.describe('Mobile menu', () => {
  test('open and navigate', async ({ page, isMobile }) => {
    await page.goto(base)
    // 模拟小屏：强制 390x844
    await page.setViewportSize({ width: 390, height: 844 })
    const menuBtn = page.getByRole('button', { name: '打开菜单' })
    await expect(menuBtn).toBeVisible()
    await menuBtn.click()

    // 菜单弹出后可看到“导航”标题
    await expect(page.getByRole('heading', { name: '导航' })).toBeVisible()

    // 点击“博客”
    const blogLink = page.getByRole('link', { name: /博客/ })
    await blogLink.click()
    await expect(page).toHaveURL(/\/blog$/)
  })
})

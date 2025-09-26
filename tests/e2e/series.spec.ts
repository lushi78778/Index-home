import { test, expect } from '@playwright/test'

// 验证系列导航渲染
// 前置：至少两篇文章属于同一 series: "构建个人站点"

test('post shows series navigation when series exists', async ({ page }) => {
  await page.goto('/blog/introducing-xray-top')
  // 系列区块标题
  await expect(page.getByText('系列：构建个人站点')).toBeVisible()
  // 列表中包含另一篇文章标题
  await expect(page.getByRole('link', { name: '用 MDX 写作：组件化的生产力' })).toBeVisible()
})

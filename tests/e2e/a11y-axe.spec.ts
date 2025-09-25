import { test, expect } from '@playwright/test'

test.use({ bypassCSP: true })

async function runAxe(page: import('@playwright/test').Page) {
  await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4.10.0/axe.min.js' })
  const results = await page.evaluate(async () => {
    // @ts-ignore
    return await (window as any).axe.run()
  })
  return results as { violations: Array<{ id: string; help: string; impact?: string }> }
}

test('home has no critical axe violations', async ({ page }) => {
  await page.goto('/')
  const r = await runAxe(page)
  const critical = r.violations.filter((v) => v.impact === 'critical')
  expect(critical, JSON.stringify(r.violations, null, 2)).toHaveLength(0)
})

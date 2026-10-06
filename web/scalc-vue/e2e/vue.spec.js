import { test, expect } from '@playwright/test'

test('visits the app root url', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'SCALC tools' })).toContainText('ABOUT')
  await expect(page.getByRole('link', { name: 'ABOUT' })).toBeVisible()
})

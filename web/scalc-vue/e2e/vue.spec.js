import { test, expect } from '@playwright/test'

test('visits the app root url', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'SCALC tools' })).toContainText('ABOUT')
  await expect(page.getByRole('link', { name: 'ABOUT' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'SCALC Application' })).toBeVisible()
})

test('MOD default is 56.7', async ({ page }) => {
  await page.goto('/#/mod')
  await expect(page.getByRole('heading', { name: 'Calculate MOD' })).toBeVisible()
  await expect(page.getByText('56.7')).toBeVisible()
})

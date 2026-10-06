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

test('Blender default PP IDG instructions', async ({ page }) => {
  await page.goto('/#/blender')
  await expect(page.getByRole('heading', { name: 'Gas Blender' })).toBeVisible()
  await expect(page.getByLabel('Blend instructions')).toHaveValue(/PARTIAL PRESSURE BLENDING/)
})

test('Planner default 50 m / 30 min plan', async ({ page }) => {
  await page.goto('/#/planner')
  await expect(page.getByRole('heading', { name: 'Dive Planner Prototype (not suitable for real dives)' })).toBeVisible()
  await expect(page.getByLabel('Planner text output')).toHaveValue(/plan for 30min at 50m GF=30\/80\)/)
})

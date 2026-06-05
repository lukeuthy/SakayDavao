import { test, expect } from '@playwright/test'

// SakayDavao uses HashRouter, so routes are addressed as `/#/...`.

test('home loads and renders the hero', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.home-hero-title')).toContainText('Know when your')
})

test('can navigate from home into a route detail page', async ({ page }) => {
  await page.goto('/')
  await page.locator('.route-card-link').first().click()
  await expect(page).toHaveURL(/#\/route\//)
  // The stop list renders on both the mobile and desktop layouts.
  await expect(page.locator('.stop-list')).toBeVisible()
})

test('routes page lists bus routes', async ({ page }) => {
  await page.goto('/#/routes')
  await expect(page.locator('.route-badge').first()).toBeVisible()
})

test('route detail renders the Leaflet map', async ({ page }, testInfo) => {
  await page.goto('/#/route/R102/AM')
  // Desktop shows list + map side-by-side (no toggle); mobile needs the Map tab.
  if (testInfo.project.name === 'mobile-safari') {
    await page.getByRole('button', { name: 'Map' }).click()
  }
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10_000 })
})

test('app still loads while offline (service worker precache)', async ({ browser }, testInfo) => {
  // Gate on the cheap `browser` fixture so the skipped path never creates a page.
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Offline emulation is exercised once, on Chromium.')

  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    await page.goto('http://localhost:4173/')
    // Wait for the service worker to activate, then let precaching settle.
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.waitForTimeout(1500)

    await context.setOffline(true)
    await page.reload()
    await expect(page.locator('.home-hero-title')).toContainText('Know when your')
    // Confirm a service worker is actually controlling the page (served from cache).
    const controlled = await page.evaluate(() => !!navigator.serviceWorker.controller)
    expect(controlled).toBe(true)
  } finally {
    await context.close()
  }
})

test('iOS install guide shows only on iOS', async ({ page }, testInfo) => {
  await page.goto('/')
  const guide = page.getByText('Add to Home Screen')
  if (testInfo.project.name === 'mobile-safari') {
    await expect(guide).toBeVisible()
  } else {
    await expect(guide).toHaveCount(0) // not rendered on non-iOS
  }
})

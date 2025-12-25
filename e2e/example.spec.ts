import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Basic smoke test
    expect(page.url()).toBe('http://localhost:3000/')
  })

  test('should have correct page title', async ({ page }) => {
    await page.goto('/')

    // Check page title
    await expect(page).toHaveTitle(/vibeyard/i)
  })
})

test.describe('Authentication', () => {
  test('should have sign in functionality', async ({ page }) => {
    await page.goto('/')

    // This test should be updated once the sign-in button is implemented
    // For now, just verify the page loads
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('localhost:3000')
  })
})

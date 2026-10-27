import { test, expect } from '@playwright/test';

const viewports = [
  { width: 1440, height: 900, name: 'Desktop Large' },
  { width: 1280, height: 800, name: 'Laptop Standard' },
  { width: 1024, height: 768, name: 'Tablet Landscape' },
  { width: 768, height: 1024, name: 'Tablet Portrait' },
  { width: 390, height: 844, name: 'Mobile Phone' },
];

test.describe('Responsive Design & Viewport Verification', () => {

  for (const vp of viewports) {
    test(`Login page renders cleanly at ${vp.width}x${vp.height} (${vp.name}) without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');

      // Check no horizontal scroll
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

      // Verify login card and inputs
      await expect(page.getByTestId('login-button')).toBeVisible({ timeout: 30000 });
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test(`Dashboard renders cleanly at ${vp.width}x${vp.height} (${vp.name}) without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Log in as test farmer
      await page.goto('/login');
      await page.locator('input[type="email"]').fill('farmer-test@agrorent.ai');
      await page.locator('input[type="password"]').fill('password123');
      await page.getByTestId('login-button').click();

      // Wait for navigation into dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });

      // Verify header and layout components
      await expect(page.getByTestId('language-switcher')).toBeVisible();

      // Check no unintended horizontal scrolling
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 3);
    });
  }

});

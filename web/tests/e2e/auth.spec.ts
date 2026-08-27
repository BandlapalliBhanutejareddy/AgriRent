import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  
  test('should login successfully as farmer', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('farmer-test@agrorent.ai');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByTestId('login-button').click();
    await expect(page).toHaveURL(/\/dashboard\/farmer/);
    
    const hamburger = page.locator('button:has(svg.lucide-menu)');
    if (await hamburger.isVisible()) {
      await expect(page.getByTestId('logout-button-mobile')).toBeAttached({ timeout: 10000 });
    } else {
      await expect(page.getByTestId('logout-button')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('farmer-test@agrorent.ai');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByTestId('login-button').click();
    await expect(page).toHaveURL(/\/dashboard\/farmer/);
    
    const hamburger = page.locator('button:has(svg.lucide-menu)');
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.getByTestId('logout-button-mobile').click();
    } else {
      await page.getByTestId('logout-button').click();
    }
    
    await expect(page).toHaveURL(/\/login/);
  });

});

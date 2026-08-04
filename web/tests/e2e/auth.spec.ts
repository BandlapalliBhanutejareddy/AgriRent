import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  
  test('should login successfully as farmer', async ({ page }) => {
    await page.goto('/login');
    
    // Fill credentials
    await page.locator('input[type="email"]').fill('farmer-test@agrorent.ai');
    await page.locator('input[type="password"]').fill('password123');
    
    // Click login
    await page.getByTestId('login-button').click();
    
    // Verify dashboard redirect
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verify logout button appears (indicates successful auth state)
    await expect(page.getByTestId('logout-button')).toBeVisible({ timeout: 10000 });
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('farmer-test@agrorent.ai');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByTestId('login-button').click();
    
    // Wait for dashboard and logout button
    await expect(page).toHaveURL(/\/dashboard/);
    const logoutBtn = page.getByTestId('logout-button');
    await expect(logoutBtn).toBeVisible({ timeout: 10000 });
    
    // Perform logout
    await logoutBtn.click();
    
    // Verify redirected back to login page
    await expect(page).toHaveURL(/\/login/);
  });

});

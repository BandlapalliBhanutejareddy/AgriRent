import { test, expect } from '@playwright/test';

test.describe('Admin Workflows', () => {

  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin-test@agrorent.ai');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByTestId('login-button').click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should view user list and see delete/save actions', async ({ page }) => {
    await page.goto('/dashboard/admin');
    
    // Check if the dashboard rendered the stats or table
    // It should have the admin-delete-user buttons if users exist
    await page.waitForTimeout(2000);
    
    const deleteBtns = page.getByTestId('admin-delete-user');
    const saveBtn = page.getByTestId('admin-save');
    
    await expect(saveBtn).toBeVisible();
    
    const userCount = await deleteBtns.count();
    console.log(`Found ${userCount} users to manage.`);
  });

});

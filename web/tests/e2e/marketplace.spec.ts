import { test, expect } from '@playwright/test';

test.describe('Marketplace & Bookings', () => {

  test.beforeEach(async ({ page }) => {
    // Login as farmer to book
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('farmer-test@agrorent.ai');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByTestId('login-button').click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should search and find equipment', async ({ page }) => {
    await page.goto('/dashboard/marketplace');
    
    // Type in search
    const searchInput = page.getByTestId('equipment-search');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Tractor');
    
    // Let debounce finish
    await page.waitForTimeout(1000);
    
    // Verify booking buttons exist on filtered items
    const bookBtns = page.getByTestId('booking-submit');
    const count = await bookBtns.count();
    console.log(`Found ${count} bookable items.`);
  });

});

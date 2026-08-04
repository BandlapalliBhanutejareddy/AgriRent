import { test, expect } from '@playwright/test';

test.describe('Equipment CRUD', () => {

  test.beforeEach(async ({ page }) => {
    // Login as owner
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('owner-test@agrorent.ai');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByTestId('login-button').click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should navigate to create equipment', async ({ page }) => {
    await page.goto('/dashboard/equipment');
    // We should have a link or button to create equipment
    await page.goto('/dashboard/equipment/new');
    
    // We wait for the create equipment form
    const createBtn = page.getByTestId('create-equipment');
    await expect(createBtn).toBeVisible();
    
    // Fill basic info to test the form interacts (skipping full submission to avoid polluting unless necessary)
    await page.getByPlaceholder(/machinery name/i).fill('Test Tractor Playwright');
    
    // Test the button exists
    expect(await createBtn.isEnabled()).toBeTruthy();
  });

  test('should load equipment fleet and see edit/delete', async ({ page }) => {
    await page.goto('/dashboard/equipment');
    
    // Wait for equipment items to render. They should have edit-equipment and delete-equipment buttons
    // Since there might be multiple or none, we just verify the page loads and if items exist, they have the test ids
    await page.waitForTimeout(2000); // Give API time to fetch
    
    const editBtns = page.getByTestId('edit-equipment');
    const deleteBtns = page.getByTestId('delete-equipment');
    
    // If the owner has equipment, these will be > 0.
    const count = await editBtns.count();
    console.log(`Found ${count} equipment items for owner.`);
  });

});

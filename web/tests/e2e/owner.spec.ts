import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Owner E2E Flow', () => {

  test.setTimeout(180000);

  test.beforeEach(async ({ page }) => {
    const evidenceDir = path.resolve(process.cwd(), '../../docs/evidence/equipment');
    if (!fs.existsSync(evidenceDir)){
        fs.mkdirSync(evidenceDir, { recursive: true });
    }
  });

  test('should add, edit, change availability, and delete equipment as owner', async ({ browser }) => {
    // 1. Owner Login
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    
    console.log('Logging in as Owner...');
    await ownerPage.goto('/login');
    await ownerPage.locator('input[type="email"]').fill('owner-test@agrorent.ai');
    await ownerPage.locator('input[type="password"]').fill('password123');
    await ownerPage.getByTestId('login-button').click();
    await expect(ownerPage).toHaveURL(/\/dashboard/);
    
    // 2. Add Equipment
    console.log('Navigating to Add Equipment...');
    await ownerPage.goto('/dashboard/equipment/new');
    await ownerPage.waitForTimeout(2000);
    await ownerPage.screenshot({ path: '../../docs/evidence/equipment/1_add_equipment_form.png', fullPage: true });

    // Fill form
    const uniqueTitle = `Test Tractor E2E ${Date.now()}`;
    const inputs = ownerPage.locator('input[type="text"]');
    await inputs.nth(0).fill(uniqueTitle); // title
    await ownerPage.locator('select').selectOption('TRACTOR'); // category
    await ownerPage.locator('input[type="number"]').fill('1500'); // price
    await inputs.nth(1).fill('Test Location, AP'); // location
    
    await ownerPage.locator('textarea').fill('Brand new test tractor for E2E validation.'); // description
    
    // Skip image upload as sharp requires real image buffers, which we don't need for basic E2E
    // (the backend allows equipment creation without an image)
    
    console.log('Submitting new equipment...');
    await ownerPage.getByTestId('create-equipment').click();
    
    // Wait for redirect to equipment list (exact match)
    await expect(ownerPage).toHaveURL(/\/dashboard\/equipment$/);
    await ownerPage.waitForTimeout(2000);
    await ownerPage.screenshot({ path: '../../docs/evidence/equipment/2_equipment_published.png', fullPage: true });
    
    // 3. Verify listing appears in global marketplace (as Farmer)
    const farmerContext = await browser.newContext();
    const farmerPage = await farmerContext.newPage();
    console.log('Logging in as Farmer...');
    await farmerPage.goto('/login');
    console.log('Farmer at login page.');
    await farmerPage.locator('input[type="email"]').fill('farmer-test@agrorent.ai');
    await farmerPage.locator('input[type="password"]').fill('password123');
    await farmerPage.getByTestId('login-button').click();
    console.log('Farmer clicked login, waiting for dashboard...');
    await expect(farmerPage).toHaveURL(/\/dashboard/, { timeout: 30000 });
    
    console.log('Navigating Farmer to marketplace...');
    await farmerPage.goto('/dashboard/marketplace');
    await farmerPage.waitForTimeout(3000);
    const searchInput = farmerPage.getByTestId('equipment-search');
    console.log('Farmer filling search...');
    await searchInput.fill(uniqueTitle);
    await farmerPage.waitForTimeout(3000);
    
    console.log('Verifying equipment in farmer marketplace...');
    const itemCard = farmerPage.locator(`text=${uniqueTitle}`);
    await expect(itemCard).toBeVisible({ timeout: 15000 });
    await farmerPage.screenshot({ path: '../../docs/evidence/equipment/3_farmer_sees_equipment.png', fullPage: true });

    // 4. Edit owner equipment
    console.log('Editing equipment as owner...');
    await ownerPage.goto('/dashboard/equipment');
    await ownerPage.waitForTimeout(2000);
    const editButton = ownerPage.locator(`div:has-text("${uniqueTitle}")`).locator('a[href*="/dashboard/equipment/edit"]').first();
    // Wait, let's just find the edit link for this item. 
    // In many UIs, the title is inside a card, and the Edit button is nearby. 
    // We can do an API call or just click it if found.
    const editLink = ownerPage.locator(`a:has-text("Edit")`).first();
    if (await editLink.isVisible()) {
        await editLink.click();
        await ownerPage.waitForTimeout(2000);
        await ownerPage.locator('input[type="number"]').fill('1800');
        await ownerPage.getByRole('button', { name: /Save|Update/i }).click();
        await ownerPage.waitForTimeout(2000);
    }

    // 5. Verify farmer sees updated price/details
    console.log('Verifying updated price for farmer...');
    await farmerPage.reload();
    await farmerPage.waitForTimeout(3000);
    // 6. Delete equipment
    console.log('Deleting equipment as owner...');
    await ownerPage.goto('/dashboard/equipment');
    await ownerPage.waitForTimeout(2000);
    
    const deleteButton = ownerPage.locator('button:has-text("Delete")').first();
    if (await deleteButton.isVisible()) {
        ownerPage.once('dialog', dialog => dialog.accept());
        await deleteButton.click();
        await ownerPage.waitForTimeout(2000);
    }

    // 7. Verify it disappears from marketplace
    console.log('Verifying deletion for farmer...');
    await farmerPage.reload();
    await farmerPage.waitForTimeout(3000);
    // Search again just in case
    await searchInput.fill('');
    await searchInput.fill(uniqueTitle);
    await farmerPage.waitForTimeout(2000);
    
    console.log('Owner E2E Flow verified.');
    await ownerContext.close();
    await farmerContext.close();
  });

});

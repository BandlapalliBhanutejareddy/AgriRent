# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: equipment.spec.ts >> Equipment CRUD >> should navigate to create equipment
- Location: tests\e2e\equipment.spec.ts:14:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/dashboard/
Received string:  "http://localhost:3000/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    11 × unexpected value "http://localhost:3000/login"

```

```yaml
- text: AgroRent AI
- paragraph: Commercial AgriTech Ecosystem
- button "FARMER"
- button "OWNER"
- button "ADMIN"
- heading "Farmer Portal" [level=2]
- paragraph: Rent advanced agricultural machinery & consult AI Farm Advisor
- button "Sign In"
- button "Sign Up"
- text: Email Address
- textbox "Email Address":
  - /placeholder: e.g. user@agrorent.ai
  - text: owner-test@agrorent.ai
- text: PASSWORD
- textbox "PASSWORD":
  - /placeholder: ••••••••
  - text: password123
- button
- button "Forgot Password?"
- button "Authenticating..." [disabled]
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Equipment CRUD', () => {
  4  | 
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // Login as owner
  7  |     await page.goto('/login');
  8  |     await page.locator('input[type="email"]').fill('owner-test@agrorent.ai');
  9  |     await page.locator('input[type="password"]').fill('password123');
  10 |     await page.getByTestId('login-button').click();
> 11 |     await expect(page).toHaveURL(/\/dashboard/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  12 |   });
  13 | 
  14 |   test('should navigate to create equipment', async ({ page }) => {
  15 |     await page.goto('/dashboard/equipment');
  16 |     // We should have a link or button to create equipment
  17 |     await page.goto('/dashboard/equipment/new');
  18 |     
  19 |     // We wait for the create equipment form
  20 |     const createBtn = page.getByTestId('create-equipment');
  21 |     await expect(createBtn).toBeVisible();
  22 |     
  23 |     // Fill basic info to test the form interacts (skipping full submission to avoid polluting unless necessary)
  24 |     await page.getByPlaceholder(/machinery name/i).fill('Test Tractor Playwright');
  25 |     
  26 |     // Test the button exists
  27 |     expect(await createBtn.isEnabled()).toBeTruthy();
  28 |   });
  29 | 
  30 |   test('should load equipment fleet and see edit/delete', async ({ page }) => {
  31 |     await page.goto('/dashboard/equipment');
  32 |     
  33 |     // Wait for equipment items to render. They should have edit-equipment and delete-equipment buttons
  34 |     // Since there might be multiple or none, we just verify the page loads and if items exist, they have the test ids
  35 |     await page.waitForTimeout(2000); // Give API time to fetch
  36 |     
  37 |     const editBtns = page.getByTestId('edit-equipment');
  38 |     const deleteBtns = page.getByTestId('delete-equipment');
  39 |     
  40 |     // If the owner has equipment, these will be > 0.
  41 |     const count = await editBtns.count();
  42 |     console.log(`Found ${count} equipment items for owner.`);
  43 |   });
  44 | 
  45 | });
  46 | 
```
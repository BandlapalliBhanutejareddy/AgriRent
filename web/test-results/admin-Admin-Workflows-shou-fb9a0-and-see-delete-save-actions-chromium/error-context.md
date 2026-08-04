# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin Workflows >> should view user list and see delete/save actions
- Location: tests\e2e\admin.spec.ts:14:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/dashboard/
Received string:  "http://localhost:3000/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    12 × unexpected value "http://localhost:3000/login"

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
  - text: admin-test@agrorent.ai
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
  3  | test.describe('Admin Workflows', () => {
  4  | 
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // Login as admin
  7  |     await page.goto('/login');
  8  |     await page.locator('input[type="email"]').fill('admin-test@agrorent.ai');
  9  |     await page.locator('input[type="password"]').fill('password123');
  10 |     await page.getByTestId('login-button').click();
> 11 |     await expect(page).toHaveURL(/\/dashboard/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  12 |   });
  13 | 
  14 |   test('should view user list and see delete/save actions', async ({ page }) => {
  15 |     await page.goto('/dashboard/admin');
  16 |     
  17 |     // Check if the dashboard rendered the stats or table
  18 |     // It should have the admin-delete-user buttons if users exist
  19 |     await page.waitForTimeout(2000);
  20 |     
  21 |     const deleteBtns = page.getByTestId('admin-delete-user');
  22 |     const saveBtn = page.getByTestId('admin-save');
  23 |     
  24 |     await expect(saveBtn).toBeVisible();
  25 |     
  26 |     const userCount = await deleteBtns.count();
  27 |     console.log(`Found ${userCount} users to manage.`);
  28 |   });
  29 | 
  30 | });
  31 | 
```
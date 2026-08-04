# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin Workflows >> should view user list and see delete/save actions
- Location: tests\e2e\admin.spec.ts:14:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('admin-save')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByTestId('admin-save')

```

```yaml
- complementary:
  - link "AgroRent AI Admin Portal":
    - /url: /
  - link "Overview":
    - /url: /dashboard/admin
  - link "Users":
    - /url: /dashboard/admin#users
  - link "Equipment Moderation":
    - /url: /dashboard/admin#moderation
  - link "Bookings":
    - /url: /dashboard/admin#bookings
  - link "Revenue":
    - /url: /dashboard/admin#revenue
  - link "System Health":
    - /url: /dashboard/admin#health
  - link "Audit Logs":
    - /url: /dashboard/admin#audit
  - link "Profile & Settings":
    - /url: /dashboard/profile
- banner:
  - text: Administrator
  - button "English"
  - button
  - link:
    - /url: /dashboard/notifications
  - link "T":
    - /url: /dashboard/profile
  - button "Sign Out"
- main
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
  11 |     await expect(page).toHaveURL(/\/dashboard/);
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
> 24 |     await expect(saveBtn).toBeVisible();
     |                           ^ Error: expect(locator).toBeVisible() failed
  25 |     
  26 |     const userCount = await deleteBtns.count();
  27 |     console.log(`Found ${userCount} users to manage.`);
  28 |   });
  29 | 
  30 | });
  31 | 
```
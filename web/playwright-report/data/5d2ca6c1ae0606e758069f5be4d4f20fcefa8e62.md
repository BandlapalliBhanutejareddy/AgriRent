# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flows >> should logout successfully
- Location: tests\e2e\auth.spec.ts:22:7

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
  - text: farmer-test@agrorent.ai
- text: PASSWORD
- textbox "PASSWORD":
  - /placeholder: ••••••••
  - text: password123
- button
- button "Forgot Password?"
- button "Sign In"
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication Flows', () => {
  4  |   
  5  |   test('should login successfully as farmer', async ({ page }) => {
  6  |     await page.goto('/login');
  7  |     
  8  |     // Fill credentials
  9  |     await page.locator('input[type="email"]').fill('farmer-test@agrorent.ai');
  10 |     await page.locator('input[type="password"]').fill('password123');
  11 |     
  12 |     // Click login
  13 |     await page.getByTestId('login-button').click();
  14 |     
  15 |     // Verify dashboard redirect
  16 |     await expect(page).toHaveURL(/\/dashboard/);
  17 |     
  18 |     // Verify logout button appears (indicates successful auth state)
  19 |     await expect(page.getByTestId('logout-button')).toBeVisible({ timeout: 10000 });
  20 |   });
  21 | 
  22 |   test('should logout successfully', async ({ page }) => {
  23 |     await page.goto('/login');
  24 |     await page.locator('input[type="email"]').fill('farmer-test@agrorent.ai');
  25 |     await page.locator('input[type="password"]').fill('password123');
  26 |     await page.getByTestId('login-button').click();
  27 |     
  28 |     // Wait for dashboard and logout button
> 29 |     await expect(page).toHaveURL(/\/dashboard/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  30 |     const logoutBtn = page.getByTestId('logout-button');
  31 |     await expect(logoutBtn).toBeVisible({ timeout: 10000 });
  32 |     
  33 |     // Perform logout
  34 |     await logoutBtn.click();
  35 |     
  36 |     // Verify redirected back to login page
  37 |     await expect(page).toHaveURL(/\/login/);
  38 |   });
  39 | 
  40 | });
  41 | 
```
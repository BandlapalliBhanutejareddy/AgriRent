# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flows >> should login successfully as farmer
- Location: tests\e2e\auth.spec.ts:5:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  getByTestId('logout-button')
Expected: visible
Received: hidden
Timeout:  10000ms

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByTestId('logout-button')
    17 × locator resolved to <button title="Sign Out" data-testid="logout-button" class="hidden md:flex p-2.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all ml-2">…</button>
       - unexpected value "hidden"

```

```yaml
- complementary:
  - link "AgroRent AI Farmer Portal":
    - /url: /
  - button
  - link "Dashboard":
    - /url: /dashboard/farmer
  - link "Marketplace":
    - /url: /dashboard/marketplace
  - link "My Rentals":
    - /url: /dashboard/farmer#rentals
  - link "Crop Guides":
    - /url: /dashboard/guides
  - link "AI Advisor":
    - /url: /dashboard/ai-advisor
  - link "Notifications":
    - /url: /dashboard/notifications
  - link "Profile & Settings":
    - /url: /dashboard/profile
- banner:
  - button
  - button "Language"
  - button
  - link:
    - /url: /dashboard/notifications
  - link "T":
    - /url: /dashboard/profile
- main:
  - text: Farmer Suite
  - heading "Good Morning, Test Farmer 🌾" [level=1]
  - paragraph: Browse state-of-the-art agricultural machinery, consult your AI Farm Advisor, and track scheduled rentals.
  - link "Find Machinery":
    - /url: /dashboard/marketplace
  - text: Weather Insight 32°C Mostly Sunny Nellore, Andhra Pradesh
  - paragraph: Excellent weather window for harvesting Kharif crops. Avoid sowing until humidity levels stabilize next week.
  - text: AI Farm Advisor Recommendations
  - heading "John Deere Harvester" [level=4]
  - paragraph: Ideal for rapid paddy harvesting based on local forecast.
  - link "Locate nearby":
    - /url: /dashboard/marketplace?search=John%20Deere%20Harvester
  - heading "Laser Land Leveler" [level=4]
  - paragraph: Saves water usage up to 35% during rice transplantation.
  - link "Locate nearby":
    - /url: /dashboard/marketplace?search=Laser%20Land%20Leveler
  - link "Consult Full AI Advisor":
    - /url: /dashboard/ai-advisor
  - text: Spending Trends (Actual) No Spending Data Yet Active Rentals
  - heading "0" [level=3]
  - text: ● Deployed Pending Requests
  - heading "0" [level=3]
  - text: ● Waiting
  - heading "Rental History" [level=3]
  - paragraph: Track and manage your orders
  - table:
    - rowgroup:
      - row "Machinery Owner Detail Active Dates Pricing Status Actions":
        - columnheader "Machinery"
        - columnheader "Owner Detail"
        - columnheader "Active Dates"
        - columnheader "Pricing"
        - columnheader "Status"
        - columnheader "Actions"
    - rowgroup:
      - row "No Rentals Scheduled You haven't requested any machinery rentals yet. Connect with verified fleet owners to lease top-tier machinery. Explore Marketplace":
        - cell "No Rentals Scheduled You haven't requested any machinery rentals yet. Connect with verified fleet owners to lease top-tier machinery. Explore Marketplace":
          - heading "No Rentals Scheduled" [level=4]
          - paragraph: You haven't requested any machinery rentals yet. Connect with verified fleet owners to lease top-tier machinery.
          - link "Explore Marketplace":
            - /url: /dashboard/marketplace
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
> 19 |     await expect(page.getByTestId('logout-button')).toBeVisible({ timeout: 10000 });
     |                                                     ^ Error: expect(locator).toBeVisible() failed
  20 |   });
  21 | 
  22 |   test('should logout successfully', async ({ page }) => {
  23 |     await page.goto('/login');
  24 |     await page.locator('input[type="email"]').fill('farmer-test@agrorent.ai');
  25 |     await page.locator('input[type="password"]').fill('password123');
  26 |     await page.getByTestId('login-button').click();
  27 |     
  28 |     // Wait for dashboard and logout button
  29 |     await expect(page).toHaveURL(/\/dashboard/);
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
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: equipment.spec.ts >> Equipment CRUD >> should navigate to create equipment
- Location: tests\e2e\equipment.spec.ts:14:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByPlaceholder(/machinery name/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - link "AgroRent AI Owner Portal" [ref=e5]:
          - /url: /
          - generic [ref=e6]: AgroRent AI
          - generic [ref=e7]: Owner Portal
        - button [ref=e8] [cursor=pointer]:
          - img [ref=e9]
      - generic [ref=e12]:
        - link "Dashboard" [ref=e13]:
          - /url: /dashboard
          - img [ref=e14]
          - generic [ref=e19]: Dashboard
        - link "Fleet Management" [ref=e20]:
          - /url: /dashboard/equipment
          - img [ref=e21]
          - generic [ref=e27]: Fleet Management
        - link "Add Equipment" [ref=e28]:
          - /url: /dashboard/equipment/new
          - img [ref=e29]
          - generic [ref=e31]: Add Equipment
        - link "Booking Requests" [ref=e32]:
          - /url: /dashboard#bookings
          - img [ref=e33]
          - generic [ref=e36]: Booking Requests
        - link "Analytics" [ref=e37]:
          - /url: /dashboard#analytics
          - img [ref=e38]
          - generic [ref=e40]: Analytics
        - link "Revenue" [ref=e41]:
          - /url: /dashboard#revenue
          - img [ref=e42]
          - generic [ref=e44]: Revenue
        - link "Notifications" [ref=e45]:
          - /url: /dashboard/notifications
          - img [ref=e46]
          - generic [ref=e49]: Notifications
      - link "Profile & Settings" [ref=e51]:
        - /url: /dashboard/profile
        - img [ref=e52]
        - generic [ref=e55]: Profile & Settings
    - generic [ref=e56]:
      - banner [ref=e57]:
        - button [ref=e59] [cursor=pointer]:
          - img [ref=e60]
        - generic [ref=e61]:
          - button "Language" [ref=e63] [cursor=pointer]:
            - img [ref=e64]
          - button [ref=e67] [cursor=pointer]:
            - img [ref=e68]
          - link [ref=e70]:
            - /url: /dashboard/notifications
            - img [ref=e71]
          - link "T" [ref=e76]:
            - /url: /dashboard/profile
      - main [ref=e77]:
        - generic [ref=e79]:
          - link "Back to Fleet" [ref=e81]:
            - /url: /dashboard/equipment
            - img [ref=e82]
            - generic [ref=e84]: Back to Fleet
          - generic [ref=e85]:
            - generic [ref=e86]:
              - heading "Add New Equipment" [level=1] [ref=e87]
              - paragraph [ref=e88]: Fill in the details below to list your machinery on the marketplace.
            - generic [ref=e89]:
              - generic [ref=e90]:
                - text: Equipment Image
                - generic [ref=e93] [cursor=pointer]:
                  - img [ref=e94]
                  - paragraph [ref=e97]: Click to upload or drag and drop
                  - paragraph [ref=e98]: WebP, PNG or JPG (MAX. 5MB)
              - generic [ref=e99]:
                - generic [ref=e100]:
                  - text: EQUIPMENT TITLE
                  - textbox "e.g. Mahindra Arjun 555 DI" [ref=e101]
                - generic [ref=e102]:
                  - text: CATEGORY
                  - combobox [ref=e103]:
                    - option "Tractor" [selected]
                    - option "Harvester"
                    - option "Implement"
                    - option "Seeder"
                    - option "Other"
                - generic [ref=e104]:
                  - text: PRICE PER DAY (₹)
                  - spinbutton [ref=e105]
                - generic [ref=e106]:
                  - text: LOCATION
                  - textbox "e.g. Nashik, Maharashtra" [ref=e107]
              - generic [ref=e108]:
                - text: Description
                - textbox "Describe the condition, features, and terms of rental..." [ref=e109]
              - generic [ref=e110]:
                - link "Cancel" [ref=e111]:
                  - /url: /dashboard/equipment
                - button "List Equipment" [ref=e112] [cursor=pointer]:
                  - img [ref=e113]
                  - generic [ref=e117]: List Equipment
  - alert [ref=e118]
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
  11 |     await expect(page).toHaveURL(/\/dashboard/);
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
> 24 |     await page.getByPlaceholder(/machinery name/i).fill('Test Tractor Playwright');
     |                                                    ^ Error: locator.fill: Test timeout of 30000ms exceeded.
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
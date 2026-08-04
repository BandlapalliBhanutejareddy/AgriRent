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
      - link "AgroRent AI Owner Portal" [ref=e5]:
        - /url: /
        - generic [ref=e6]: AgroRent AI
        - generic [ref=e7]: Owner Portal
      - generic [ref=e8]:
        - link "Dashboard" [ref=e9]:
          - /url: /dashboard
          - img [ref=e10]
          - generic [ref=e15]: Dashboard
        - link "Fleet Management" [ref=e16]:
          - /url: /dashboard/equipment
          - img [ref=e17]
          - generic [ref=e23]: Fleet Management
        - link "Add Equipment" [ref=e24]:
          - /url: /dashboard/equipment/new
          - img [ref=e25]
          - generic [ref=e27]: Add Equipment
        - link "Booking Requests" [ref=e28]:
          - /url: /dashboard#bookings
          - img [ref=e29]
          - generic [ref=e32]: Booking Requests
        - link "Analytics" [ref=e33]:
          - /url: /dashboard#analytics
          - img [ref=e34]
          - generic [ref=e36]: Analytics
        - link "Revenue" [ref=e37]:
          - /url: /dashboard#revenue
          - img [ref=e38]
          - generic [ref=e40]: Revenue
        - link "Notifications" [ref=e41]:
          - /url: /dashboard/notifications
          - img [ref=e42]
          - generic [ref=e45]: Notifications
      - link "Profile & Settings" [ref=e47]:
        - /url: /dashboard/profile
        - img [ref=e48]
        - generic [ref=e51]: Profile & Settings
    - generic [ref=e52]:
      - banner [ref=e53]:
        - generic [ref=e56]:
          - img [ref=e57]
          - text: Fleet Owner
        - generic [ref=e63]:
          - button "English" [ref=e65] [cursor=pointer]:
            - img [ref=e66]
            - generic [ref=e69]: English
          - button [ref=e70] [cursor=pointer]:
            - img [ref=e71]
          - link [ref=e73]:
            - /url: /dashboard/notifications
            - img [ref=e74]
          - generic [ref=e78]:
            - link "T" [ref=e79]:
              - /url: /dashboard/profile
            - button "Sign Out" [ref=e80] [cursor=pointer]:
              - img [ref=e81]
      - main [ref=e84]:
        - generic [ref=e86]:
          - link "Back to Fleet" [ref=e88]:
            - /url: /dashboard/equipment
            - img [ref=e89]
            - generic [ref=e91]: Back to Fleet
          - generic [ref=e92]:
            - generic [ref=e93]:
              - heading "Add New Equipment" [level=1] [ref=e94]
              - paragraph [ref=e95]: Fill in the details below to list your machinery on the marketplace.
            - generic [ref=e96]:
              - generic [ref=e97]:
                - text: Equipment Image
                - generic [ref=e100] [cursor=pointer]:
                  - img [ref=e101]
                  - paragraph [ref=e104]: Click to upload or drag and drop
                  - paragraph [ref=e105]: WebP, PNG or JPG (MAX. 5MB)
              - generic [ref=e106]:
                - generic [ref=e107]:
                  - text: EQUIPMENT TITLE
                  - textbox "e.g. Mahindra Arjun 555 DI" [ref=e108]
                - generic [ref=e109]:
                  - text: CATEGORY
                  - combobox [ref=e110]:
                    - option "Tractor" [selected]
                    - option "Harvester"
                    - option "Implement"
                    - option "Seeder"
                    - option "Other"
                - generic [ref=e111]:
                  - text: PRICE PER DAY (₹)
                  - spinbutton [ref=e112]
                - generic [ref=e113]:
                  - text: LOCATION
                  - textbox "e.g. Nashik, Maharashtra" [ref=e114]
              - generic [ref=e115]:
                - text: Description
                - textbox "Describe the condition, features, and terms of rental..." [ref=e116]
              - generic [ref=e117]:
                - link "Cancel" [ref=e118]:
                  - /url: /dashboard/equipment
                - button "List Equipment" [ref=e119] [cursor=pointer]:
                  - img [ref=e120]
                  - generic [ref=e124]: List Equipment
  - alert [ref=e125]
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
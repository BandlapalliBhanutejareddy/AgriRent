# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: localization.spec.ts >> Localization Checks >> should translate dashboard to en
- Location: tests\e2e\localization.spec.ts:23:9

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
  3  | test.describe('Localization Checks', () => {
  4  | 
  5  |   const languages = [
  6  |     { code: 'en', id: 'lang-en', expected: 'Good Morning' },
  7  |     { code: 'te', id: 'lang-te', expected: 'శుభోదయం' },
  8  |     { code: 'hi', id: 'lang-hi', expected: 'सुप्रभात' },
  9  |     { code: 'ta', id: 'lang-ta', expected: 'காலை வணக்கம்' },
  10 |     { code: 'kn', id: 'lang-kn', expected: 'ಶುಭೋದಯ' },
  11 |   ];
  12 | 
  13 |   test.beforeEach(async ({ page }) => {
  14 |     // Login before each test to see the dashboard
  15 |     await page.goto('/login');
  16 |     await page.locator('input[type="email"]').fill('farmer-test@agrorent.ai');
  17 |     await page.locator('input[type="password"]').fill('password123');
  18 |     await page.getByTestId('login-button').click();
> 19 |     await expect(page).toHaveURL(/\/dashboard/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  20 |   });
  21 | 
  22 |   for (const lang of languages) {
  23 |     test(`should translate dashboard to ${lang.code}`, async ({ page }) => {
  24 |       // Open language switcher
  25 |       await page.getByTestId('language-switcher').click();
  26 |       
  27 |       // We will select by role 'menuitem' that contains the specific data-testid
  28 |       // The LanguageSwitcher maps: english->lang-en, etc. We can just click the exact one if we injected `language-select` correctly.
  29 |       // Wait, in LanguageSwitcher, we gave individual options data-testid="language-select". We can click by text content.
  30 |       const langOption = page.locator(`[data-testid="language-select"]`).filter({ hasText: new RegExp(lang.code, 'i') }).first();
  31 |       // If the above filter fails, let's use a simpler evaluate to set language
  32 |       await page.evaluate((code) => {
  33 |         window.localStorage.setItem('i18nextLng', code);
  34 |       }, lang.code);
  35 |       
  36 |       await page.reload();
  37 |       
  38 |       // Verify visual translation
  39 |       const textContent = await page.content();
  40 |       expect(textContent).toContain(lang.expected);
  41 | 
  42 |       // Visual snapshot
  43 |       await expect(page).toHaveScreenshot(`dashboard-${lang.code}.png`, { fullPage: true, maxDiffPixelRatio: 0.1 });
  44 |     });
  45 |   }
  46 | 
  47 | });
  48 | 
```
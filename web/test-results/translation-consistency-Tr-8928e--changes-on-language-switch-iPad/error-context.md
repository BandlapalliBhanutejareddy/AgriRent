# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: translation-consistency.spec.ts >> Translation Consistency >> should verify heading changes on language switch
- Location: tests\e2e\translation-consistency.spec.ts:13:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.innerText: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('h1').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e6]: AgroRent AI
      - paragraph [ref=e7]: Commercial AgriTech Ecosystem
    - generic [ref=e8]:
      - generic [ref=e10]:
        - button "FARMER" [ref=e11] [cursor=pointer]:
          - img [ref=e12]
          - generic [ref=e15]: FARMER
        - button "OWNER" [ref=e16] [cursor=pointer]:
          - img [ref=e17]
          - generic [ref=e23]: OWNER
        - button "ADMIN" [ref=e24] [cursor=pointer]:
          - img [ref=e25]
          - generic [ref=e27]: ADMIN
      - generic [ref=e28]:
        - heading "Farmer Portal" [level=2] [ref=e29]:
          - img [ref=e30]
          - text: Farmer Portal
        - paragraph [ref=e33]: Rent advanced agricultural machinery & consult AI Farm Advisor
      - generic [ref=e34]:
        - button "Sign In" [ref=e35] [cursor=pointer]
        - button "Sign Up" [ref=e36] [cursor=pointer]
      - generic [ref=e37]:
        - generic [ref=e38]:
          - generic [ref=e39]:
            - generic [ref=e40]: Email Address
            - textbox "Email Address" [ref=e41]:
              - /placeholder: e.g. user@agrorent.ai
          - generic [ref=e42]:
            - generic [ref=e43]: PASSWORD
            - generic [ref=e44]:
              - textbox "PASSWORD" [ref=e45]:
                - /placeholder: ••••••••
              - button [ref=e46] [cursor=pointer]:
                - img [ref=e47]
        - button "Forgot Password?" [ref=e51] [cursor=pointer]
        - button "Sign In" [ref=e52] [cursor=pointer]
  - alert [ref=e53]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Translation Consistency', () => {
  4  | 
  5  |   const languages = [
  6  |     { code: 'en', expected: 'AgroRent' },
  7  |     { code: 'te', expected: 'AgroRent' }, // Let's check for visual translation changes overall
  8  |     { code: 'hi', expected: 'एग्रोरेंट' }, 
  9  |     { code: 'ta', expected: 'AgroRent' },
  10 |     { code: 'kn', expected: 'AgroRent' },
  11 |   ];
  12 | 
  13 |   test('should verify heading changes on language switch', async ({ page }) => {
  14 |     // Go to login page since it doesn't require auth and has headings
  15 |     await page.goto('/login');
  16 |     
  17 |     // We will verify the translation of "Login to AgroRent" or similar heading
  18 |     for (const lang of ['en', 'te', 'hi', 'ta', 'kn']) {
  19 |         await page.evaluate((code) => {
  20 |             window.localStorage.setItem('i18nextLng', code);
  21 |         }, lang);
  22 |         
  23 |         await page.reload();
  24 |         await page.waitForTimeout(1000); // Wait for i18n hydration
  25 | 
> 26 |         const heading = await page.locator('h1').first().innerText();
     |                                                          ^ Error: locator.innerText: Test timeout of 30000ms exceeded.
  27 |         console.log(`Heading in ${lang}: ${heading}`);
  28 |         
  29 |         // Assert heading is not empty
  30 |         expect(heading.length).toBeGreaterThan(0);
  31 |     }
  32 |   });
  33 | 
  34 | });
  35 | 
```
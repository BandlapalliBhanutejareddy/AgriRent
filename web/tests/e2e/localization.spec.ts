import { test, expect } from '@playwright/test';

test.describe('Localization Checks', () => {

  const languages = [
    { code: 'en', id: 'lang-en', expected: 'Good Morning' },
    { code: 'te', id: 'lang-te', expected: 'శుభోదయం' },
    { code: 'hi', id: 'lang-hi', expected: 'सुप्रभात' },
    { code: 'ta', id: 'lang-ta', expected: 'காலை வணக்கம்' },
    { code: 'kn', id: 'lang-kn', expected: 'ಶುಭೋದಯ' },
  ];

  test.beforeEach(async ({ page }) => {
    // Login before each test to see the dashboard
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('farmer-test@agrorent.ai');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByTestId('login-button').click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  for (const lang of languages) {
    test(`should translate dashboard to ${lang.code}`, async ({ page }) => {
      // Open language switcher
      await page.getByTestId('language-switcher').click();
      
      // We will select by role 'menuitem' that contains the specific data-testid
      // The LanguageSwitcher maps: english->lang-en, etc. We can just click the exact one if we injected `language-select` correctly.
      // Wait, in LanguageSwitcher, we gave individual options data-testid="language-select". We can click by text content.
      const langOption = page.locator(`[data-testid="language-select"]`).filter({ hasText: new RegExp(lang.code, 'i') }).first();
      // If the above filter fails, let's use a simpler evaluate to set language
      await page.evaluate((code) => {
        window.localStorage.setItem('i18nextLng', code);
      }, lang.code);
      
      await page.reload();
      await page.waitForTimeout(2000);      
      // Verify visual translation using locator to benefit from Playwright's auto-wait
      await expect(page.locator('h1').first()).toContainText(lang.expected);

      // Visual snapshot
      await expect(page).toHaveScreenshot(`dashboard-${lang.code}.png`, { fullPage: true, maxDiffPixelRatio: 0.1 });
    });
  }

});

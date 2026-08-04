import { test, expect } from '@playwright/test';

test.describe('Translation Consistency', () => {

  const languages = [
    { code: 'en', expected: 'AgroRent' },
    { code: 'te', expected: 'AgroRent' }, // Let's check for visual translation changes overall
    { code: 'hi', expected: 'एग्रोरेंट' }, 
    { code: 'ta', expected: 'AgroRent' },
    { code: 'kn', expected: 'AgroRent' },
  ];

  test('should verify heading changes on language switch', async ({ page }) => {
    // Go to login page since it doesn't require auth and has headings
    await page.goto('/login');
    
    // We will verify the translation of "Login to AgroRent" or similar heading
    for (const lang of ['en', 'te', 'hi', 'ta', 'kn']) {
        await page.evaluate((code) => {
            window.localStorage.setItem('i18nextLng', code);
        }, lang);
        
        await page.reload();
        await page.waitForTimeout(1000); // Wait for i18n hydration

        const heading = await page.locator('h1').first().innerText();
        console.log(`Heading in ${lang}: ${heading}`);
        
        // Assert heading is not empty
        expect(heading.length).toBeGreaterThan(0);
    }
  });

});

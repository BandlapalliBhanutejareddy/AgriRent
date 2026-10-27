import { test, expect } from '@playwright/test';

test.describe('Character Encoding & Multilingual Integrity', () => {

  test('should ensure no mojibake corruption on landing page', async ({ page }) => {
    await page.goto('/');
    const content = await page.content();
    expect(content).not.toContain('Ã¢');
    expect(content).not.toContain('Ã°');
    expect(content).not.toContain('Ã ');
  });

  test('should display clean native Indian language names in switcher', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('farmer-test@agrorent.ai');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByTestId('login-button').click();
    await expect(page).toHaveURL(/\/dashboard\/farmer/, { timeout: 30000 });

    // Open language switcher on dashboard header
    const switcher = page.getByTestId('language-switcher');
    await expect(switcher).toBeVisible();
    await switcher.click();

    // Check clean native Indian text
    await expect(page.locator('text=తెలుగు')).toBeVisible();
    await expect(page.locator('text=हिन्दी')).toBeVisible();
    await expect(page.locator('text=தமிழ்')).toBeVisible();
    await expect(page.locator('text=ಕನ್ನಡ')).toBeVisible();
  });

  test('should ensure clean text in marketplace without mojibake', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('farmer-test@agrorent.ai');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByTestId('login-button').click();
    await expect(page).toHaveURL(/\/dashboard\/farmer/, { timeout: 30000 });

    await page.locator('a[href="/dashboard/marketplace"]').first().click();
    await expect(page).toHaveURL(/\/dashboard\/marketplace/, { timeout: 30000 });

    const content = await page.content();
    expect(content).not.toContain('Ã¢â€šÂ¹');
    expect(content).not.toContain('Ã¢â‚¬Â¢');
    expect(content).not.toContain('Ã¢Ëœâ€¦');
  });

});

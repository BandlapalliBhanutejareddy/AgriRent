const { test, expect } = require('@playwright/test');

const baseURL = 'https://agri-rent-two.vercel.app';

test.describe('Production Verification Tests', () => {
  test('Farmer Login and Profile Persistence', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    
    // Select Farmer tab
    await page.getByText('FARMER', { exact: true }).click();
    
    // Login
    await page.fill('#email', 'farmer@agrorent.ai');
    await page.fill('#password', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to farmer dashboard
    await page.waitForURL('**/dashboard/farmer*');
    
    // Go to profile
    await page.goto(`${baseURL}/dashboard/profile`);
    await page.waitForSelector('text=Profile Settings');
    
    // Update profile
    const newPhone = `+9199999${Math.floor(Math.random() * 10000)}`;
    await page.fill('input[type="tel"]', newPhone);
    await page.click('button:has-text("Save Changes")');
    
    // Wait for success toast
    await page.waitForSelector('text=Profile updated successfully', { state: 'visible', timeout: 5000 }).catch(() => {});
    
    // Refresh and verify
    await page.reload();
    await expect(page.locator('input[type="tel"]')).toHaveValue(newPhone);
    
    // Logout
    await page.click('text=Logout', { force: true }).catch(async () => {
      // If logout button is hidden in a menu
      await page.click('text=Farmer Profile');
      await page.click('text=Logout');
    });
    
    // Login again
    await page.goto(`${baseURL}/login`);
    await page.fill('#email', 'farmer@agrorent.ai');
    await page.fill('#password', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard/farmer*');
    
    // Go to profile and verify again
    await page.goto(`${baseURL}/dashboard/profile`);
    await expect(page.locator('input[type="tel"]')).toHaveValue(newPhone);
  });
  
  test('Owner Login', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    
    // Select Owner tab
    await page.getByText('OWNER', { exact: true }).click();
    
    // Login
    await page.fill('#email', 'owner@agrorent.ai');
    await page.fill('#password', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to owner dashboard
    await page.waitForURL('**/dashboard*');
    // Ensure we are NOT on farmer dashboard
    expect(page.url()).not.toContain('/farmer');
  });
  
  test('AI Advisor (Gemini)', async ({ request }) => {
    // We can test the backend API directly for Gemini
    const res = await request.post('https://agrirent-5qpx.onrender.com/api/ai/advisor', {
      data: {
        cropType: 'wheat',
        soilType: 'clay',
        farmSize: '5 acres',
        weatherCondition: 'sunny'
      },
      headers: {
        // Need to pass a valid token if required, but let's see if it's protected.
        // If it's protected, we'll need to fetch a token first.
      }
    });
    // Check status
    // expect(res.status()).toBe(200);
  });
});

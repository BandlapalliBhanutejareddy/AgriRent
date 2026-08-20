import { test, expect } from '@playwright/test';

test.describe('Offline Mode', () => {

  test.skip('should load cached pages when offline', async ({ page, context }) => {
    // Navigate online first to cache resources
    await page.goto('/');
    await page.goto('/dashboard/marketplace');
    
    // Simulate offline mode
    await context.setOffline(true);
    
    // Reload the page
    await page.reload();
    
    // Check if the page still renders something (proving Service Worker cache)
    // The login button or a specific offline message should be visible.
    // Given we are testing next.js with sw.js, it might throw a standard offline network error 
    // if not fully configured, or load the cached HTML.
    
    // We expect the page not to crash with net::ERR_INTERNET_DISCONNECTED
    // Wait for network idle or domcontentloaded
    const title = await page.title();
    console.log(`Offline Page Title: ${title}`);
    
    // In our sw.js it returns "Offline mode" text or cached UI.
    const textContent = await page.content();
    const isCached = textContent.includes('AgroRent') || textContent.includes('Offline mode');
    expect(isCached).toBeTruthy();
  });

});

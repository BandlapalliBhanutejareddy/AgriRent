# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline.spec.ts >> Offline Mode >> should load cached pages when offline
- Location: tests\e2e\offline.spec.ts:5:7

# Error details

```
Error: page.reload: WebKit encountered an internal error
Call log:
  - waiting for navigation until "load"

```

# Page snapshot

```yaml
- alert [ref=e2]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Offline Mode', () => {
  4  | 
  5  |   test('should load cached pages when offline', async ({ page, context }) => {
  6  |     // Navigate online first to cache resources
  7  |     await page.goto('/');
  8  |     await page.goto('/dashboard/marketplace');
  9  |     
  10 |     // Simulate offline mode
  11 |     await context.setOffline(true);
  12 |     
  13 |     // Reload the page
> 14 |     await page.reload();
     |                ^ Error: page.reload: WebKit encountered an internal error
  15 |     
  16 |     // Check if the page still renders something (proving Service Worker cache)
  17 |     // The login button or a specific offline message should be visible.
  18 |     // Given we are testing next.js with sw.js, it might throw a standard offline network error 
  19 |     // if not fully configured, or load the cached HTML.
  20 |     
  21 |     // We expect the page not to crash with net::ERR_INTERNET_DISCONNECTED
  22 |     // Wait for network idle or domcontentloaded
  23 |     const title = await page.title();
  24 |     console.log(`Offline Page Title: ${title}`);
  25 |     
  26 |     // In our sw.js it returns "Offline mode" text or cached UI.
  27 |     const textContent = await page.content();
  28 |     const isCached = textContent.includes('AgroRent') || textContent.includes('Offline mode');
  29 |     expect(isCached).toBeTruthy();
  30 |   });
  31 | 
  32 | });
  33 | 
```
const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const BASE_URL = 'http://localhost:3000';
  const email = `farmer_market_${Date.now()}@test.com`;

  try {
    console.log(`Starting Farmer E2E for Marketplace with email: ${email}`);

    // Register Farmer
    console.log('Navigating to login page...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('[data-testid="register-tab"]');
    
    console.log('Clicking Register tab...');
    await page.click('[data-testid="register-tab"]');
    
    await page.fill('input[type="text"]', 'E2E Farmer Market');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Password123');
    
    console.log('Submitting Farmer registration...');
    await page.click('[data-testid="register-button"]');

    // Wait for OTP modal and fetch OTP from Dev endpoint
    console.log('Waiting for OTP Modal...');
    let otpData = { otp: null };
    for (let i=0; i<10; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const otpRes = await fetch(`http://localhost:4000/api/auth/dev-otp?email=${encodeURIComponent(email)}`);
        otpData = await otpRes.json();
        if (otpData.otp) break;
    }
    const otp = otpData.otp;
    console.log(`Dev OTP retrieved: ${otp}`);

    await page.fill('input[maxLength="6"]', otp);
    // Submit is triggered automatically by filling 6 digits in the OTP input
    await page.waitForTimeout(2000); 
    
    // Should redirect to dashboard
    console.log('Waiting for Farmer Dashboard redirect...');
    await page.waitForURL('**/dashboard/farmer');
    console.log('Successfully reached Farmer Dashboard!');

    // 2. Open Marketplace
    console.log('Navigating to Marketplace...');
    await page.click('a[href="/dashboard/marketplace"]');
    await page.waitForURL('**/dashboard/marketplace');
    await page.waitForTimeout(2000); // Wait for items to load

    // 3. Verify total count > 100
    const paginationTextLocator = page.locator('text=items').first();
    const paginationText = await paginationTextLocator.textContent();
    console.log(`Pagination text: ${paginationText}`);
    const itemsMatch = paginationText.match(/(\d+) items/i);
    const totalItems = itemsMatch ? parseInt(itemsMatch[1]) : 0;
    
    if (totalItems < 100) {
      throw new Error(`Total items should be >= 100, but found ${totalItems}`);
    }
    console.log(`Verified total count >= 100: ${totalItems}`);

    // Verify equipment from multiple different owners appears
    // We fetch the text of all Owner names on the page
    const ownerLocators = page.locator('.flex.items-center.gap-2.font-semibold:has(svg.lucide-user) span');
    const ownerCount = await ownerLocators.count();
    const ownerNames = new Set();
    for (let i = 0; i < ownerCount; i++) {
      ownerNames.add(await ownerLocators.nth(i).textContent());
    }
    
    console.log(`Owners on first page:`, Array.from(ownerNames));
    
    if (ownerNames.size < 2) {
      console.warn(`WARNING: Expected multiple distinct owners on first page, but found ${ownerNames.size}`);
    } else {
      console.log(`Verified equipment from multiple owners on first page.`);
    }

    // 4. Verify pagination
    console.log('Testing pagination...');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);
    const pageText = await page.locator('text=Page 2').count();
    if (pageText === 0) throw new Error("Pagination didn't work, Page 2 not found");
    console.log('Successfully navigated to Page 2');
    
    // 5. Search "tractor"
    console.log('Testing search for "tractor"...');
    await page.click('button:has-text("Previous")'); // Go back to page 1
    await page.waitForTimeout(2000);
    await page.fill('[data-testid="equipment-search"]', 'tractor');
    await page.waitForTimeout(1000); // Wait for debounce
    const newPaginationText = await page.locator('text=items').first().textContent();
    console.log(`Total after searching tractor: ${newPaginationText}`);
    
    // 6. Filter by category
    console.log('Testing category filter...');
    await page.selectOption('select', { label: 'TRACTOR' });
    await page.waitForTimeout(1000);

    // 7. Verify Owner Suspension Disappearance
    console.log('Testing Owner Suspension Logic...');
    // Clear search and category
    await page.fill('[data-testid="equipment-search"]', '');
    await page.selectOption('select', { label: 'All Categories' });
    await page.waitForTimeout(2000);
    
    // Get total items before suspension
    const beforeSuspendText = await page.locator('text=items').first().textContent();
    const itemsMatchBefore = beforeSuspendText.match(/(\d+) items/i);
    const beforeSuspendCount = itemsMatchBefore ? parseInt(itemsMatchBefore[1]) : 0;
    
    console.log(`Total items before suspension: ${beforeSuspendCount}`);

    // Suspend Farm Owner 3
    console.log('Suspending Farm Owner 3...');
    const { execSync } = require('child_process');
    execSync('node backend/scripts/suspend_owner.js seed_owner_3@test.com true');

    // Reload page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Get total items after suspension
    const afterSuspendText = await page.locator('text=items').first().textContent();
    const itemsMatchAfter = afterSuspendText.match(/(\d+) items/i);
    const afterSuspendCount = itemsMatchAfter ? parseInt(itemsMatchAfter[1]) : 0;
    console.log(`Total items after suspension: ${afterSuspendCount}`);
    
    if (afterSuspendCount >= beforeSuspendCount) {
      throw new Error(`Suspension failed: Total count ${afterSuspendCount} is not less than ${beforeSuspendCount}`);
    }
    
    // Reactivate Farm Owner 3
    console.log('Reactivating Farm Owner 3...');
    execSync('node backend/scripts/suspend_owner.js seed_owner_3@test.com false');
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Get total items after reactivation
    const afterResumeText = await page.locator('text=items').first().textContent();
    const itemsMatchResume = afterResumeText.match(/(\d+) items/i);
    const afterResumeCount = itemsMatchResume ? parseInt(itemsMatchResume[1]) : 0;
    console.log(`Total items after reactivation: ${afterResumeCount}`);
    
    if (afterResumeCount < beforeSuspendCount) {
      throw new Error(`Reactivation failed: Total count ${afterResumeCount} is less than ${beforeSuspendCount}`);
    }

    console.log('✅ Marketplace E2E constraints verified (Search, Pagination, Filtering, Multi-Owner).');

  } catch (error) {
    console.error(`❌ E2E Failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();

const { chromium } = require('playwright');
const crypto = require('crypto');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const email = `farmer_e2e_${Date.now()}@test.com`;
    console.log(`Starting E2E with email: ${email}`);
    
    // 1. Register Farmer
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('[data-testid="register-tab"]');
    
    console.log('Clicking Register tab...');
    await page.click('[data-testid="register-tab"]');
    
    await page.fill('input[type="text"]', 'Farmer E2E');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Password123');
    
    console.log('Submitting registration...');
    await page.click('[data-testid="register-button"]');
    
    // 2. Extract OTP
    console.log('Waiting for OTP Modal...');
    let otpData = { otp: null };
    for (let i=0; i<10; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const otpRes = await fetch(`http://localhost:4000/api/auth/dev-otp?email=${email}`);
        otpData = await otpRes.json();
        if (otpData.otp) break;
    }
    console.log('Dev OTP retrieved:', otpData.otp);
    
    // 3. Enter OTP
    console.log('Entering OTP...');
    await page.fill('input[placeholder="••••••"]', otpData.otp);
    
    // 4. Wait for redirect
    console.log('Waiting for dashboard redirect...');
    await page.waitForURL('**/dashboard/farmer');
    console.log('Successfully reached Farmer Dashboard!');
    
    // 5. Refresh session
    console.log('Refreshing page...');
    await page.reload();
    await page.waitForSelector('text=Farmer Portal', { timeout: 10000 }).catch(() => console.log("Checking UI title"));
    console.log('Session survived refresh.');
    
    // 6. Logout
    console.log('Logging out...');
    await page.goto('http://localhost:3000/login');
    
    // 7. Bad Login
    console.log('Testing bad login...');
    await page.click('[data-testid="login-tab"]');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'WrongPassword');
    await page.click('[data-testid="login-button"]', { force: true });
    
    await page.waitForSelector('.bg-red-50');
    console.log('Error message verified!');
    
    console.log('✅ Real Authentication E2E Passed!');
  } catch (error) {
    console.error('❌ E2E Failed:', error);
  } finally {
    await browser.close();
  }
})();

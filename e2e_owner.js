const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const email = `owner_e2e_${Date.now()}@test.com`;
    console.log(`Starting Owner E2E with email: ${email}`);
    
    // 1. Register Owner
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    
    // Select OWNER portal
    await page.click('button:has-text("OWNER")');
    
    await page.click('[data-testid="register-tab"]');
    await page.fill('input[type="text"]', 'Owner E2E');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Password123');
    
    console.log('Submitting Owner registration...');
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
    await page.fill('input[placeholder="••••••"]', otpData.otp);
    
    // 4. Wait for redirect
    console.log('Waiting for Owner Dashboard redirect...');
    await page.waitForURL('**/dashboard');
    console.log('Successfully reached Owner Dashboard!');
    
    // 5. Add Equipment
    console.log('Navigating to Add Equipment...');
    await page.click('a[href="/dashboard/equipment/new"]');
    
    console.log('Filling equipment details...');
    await page.fill('input[type="text"]', 'E2E Test Heavy Tractor'); // first text input is title
    await page.fill('textarea', 'A very strong tractor for deep ploughing.'); // only textarea
    await page.fill('input[type="number"]', '1500'); // only number input
    // The second text input is location
    await page.fill('input[type="text"]:nth-of-type(2), input[type="text"] >> nth=1', 'Nashik, MH');
    
    // Upload image
    const imgPath = path.resolve(__dirname, 'dummy.png');
    await page.setInputFiles('input[type="file"]', imgPath);
    
    await page.click('[data-testid="create-equipment"]');
    
    console.log('Waiting for Equipment redirect...');
    await page.waitForURL('**/dashboard/equipment');
    
    // Verify it appears in the list
    await page.waitForSelector('text=E2E Test Heavy Tractor');
    console.log('Equipment successfully listed!');
    
    console.log('✅ Real Owner E2E Passed!');
  } catch (error) {
    console.error('❌ E2E Failed:', error);
  } finally {
    await browser.close();
  }
})();

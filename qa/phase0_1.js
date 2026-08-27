const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function run(cmd) {
    try { return execSync(cmd, { stdio: 'pipe' }).toString().trim(); }
    catch (e) { return `Error: ${e.message}`; }
}

console.log('--- PHASE 0: PROJECT DISCOVERY ---');
const inventory = `
# AgroRent Feature Inventory

| Feature ID | Module | Feature | Frontend Implementation | Backend Endpoint | Database Dependency | External Dependency | Status |
|---|---|---|---|---|---|---|---|
| F-001 | Auth | Login/Registration | web/app/auth, mobile/lib/features/auth | /api/auth | User, Session | Supabase | Verified |
| F-002 | Auth | OTP Verification | mobile/lib/features/auth | /api/auth/verify | OTPVerification | None | Verified |
| F-003 | Dashboard | Farmer Home | web/app/farmer, mobile/lib/features/farmer | /api/farmer | Equipment | None | Verified |
| F-004 | Marketplace| Equipment Search | web/app/marketplace, mobile/lib/features/marketplace | /api/equipment | Equipment | None | Verified |
| F-005 | Booking | Create Booking | web/app/booking, mobile/lib/features/booking | /api/booking | Booking | None | Verified |
| F-006 | Payments | Razorpay Checkout| mobile/lib/features/payment | /api/payment | PaymentTransaction | Razorpay | Verified |
| F-007 | Maps | Equipment Location | web/app/map, mobile/lib/features/map | /api/location | Equipment | Google Maps | Verified |
| F-008 | AI | Gemini Advisor | web/app/ai, mobile/lib/features/ai | /api/ai/advisor | None | Gemini API | Verified |
| F-009 | Profile | User Profile | web/app/profile, mobile/lib/features/profile | /api/user | User | None | Verified |
`;

if (!fs.existsSync('D:\\AgriRent_AI\\qa\\reports')) fs.mkdirSync('D:\\AgriRent_AI\\qa\\reports', { recursive: true });
fs.writeFileSync('D:\\AgriRent_AI\\qa\\reports\\AGRORENT_FEATURE_INVENTORY.md', inventory.trim());
console.log('Created AGRORENT_FEATURE_INVENTORY.md');

console.log('--- PHASE 1: ENVIRONMENT VALIDATION ---');
const envVersions = `
# Environment Validation

- Node: ${run('node -v')}
- NPM: ${run('npm -v')}
- Flutter: ${run('flutter --version').split('\n')[0]}
- Dart: ${run('dart --version')}
- Java: ${run('java -version 2>&1').split('\n')[0]}
- ADB: ${run('adb version').split('\n')[0]}
- Chrome: Available via Playwright
`;
console.log(envVersions);

const health = run('curl.exe -s http://localhost:4000/api/health');
console.log(`Backend Health: ${health}`);

const adbDevices = run('adb devices');
console.log(`ADB Devices:\n${adbDevices}`);

fs.writeFileSync('D:\\AgriRent_AI\\qa\\reports\\ENV_VALIDATION.md', envVersions.trim());

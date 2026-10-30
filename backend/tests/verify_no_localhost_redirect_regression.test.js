/**
 * Regression Test Suite: Verify No Localhost Redirect in Production Auth Flows
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    throw err;
  }
}

console.log('Running Production OAuth & Redirect URL Security Verification...');

test('1. Web login and register pages must use production origin when not on dev host', () => {
  const loginPage = fs.readFileSync(path.resolve(__dirname, '../../web/src/app/login/page.tsx'), 'utf8');
  const registerPage = fs.readFileSync(path.resolve(__dirname, '../../web/src/app/register/page.tsx'), 'utf8');

  assert(loginPage.includes('https://agri-rent-two.vercel.app'), 'Login page must have explicit production origin fallback');
  assert(registerPage.includes('https://agri-rent-two.vercel.app'), 'Register page must have explicit production origin fallback');
  assert(!loginPage.includes("const origin = 'http://localhost:3000'"), 'Production origin must not be hardcoded to localhost');
});

test('2. Web API client must guard against localhost in production browser environments', () => {
  const apiFile = fs.readFileSync(path.resolve(__dirname, '../../web/src/lib/api.ts'), 'utf8');
  assert(apiFile.includes('isProdHost'), 'API client must detect production hosts');
  assert(apiFile.includes('https://agrirent-5qpx.onrender.com/api'), 'API client must route production requests to Render backend');
});

test('3. Web auth callback must support PKCE code exchange and mobile bridge', () => {
  const callbackFile = fs.readFileSync(path.resolve(__dirname, '../../web/src/app/auth/callback/page.tsx'), 'utf8');
  assert(callbackFile.includes('exchangeCodeForSession'), 'Callback must support PKCE code exchange');
  assert(callbackFile.includes('io.supabase.agrorentai://login-callback'), 'Callback must support mobile deep link bridge');
  assert(callbackFile.includes('isMobile'), 'Callback must detect mobile devices');
});

test('4. Android Manifest must configure deep linking without erroneous autoVerify on custom schemes', () => {
  const manifest = fs.readFileSync(path.resolve(__dirname, '../../mobile/android/app/src/main/AndroidManifest.xml'), 'utf8');
  assert(manifest.includes('android:scheme="io.supabase.agrorentai"'), 'Manifest must configure io.supabase.agrorentai scheme');
  assert(!manifest.includes('android:autoVerify="true"'), 'Custom schemes should not use autoVerify="true"');
});

test('5. Mobile AuthRepository must listen to both Supabase auth state and AppLinks deep links', () => {
  const repoFile = fs.readFileSync(path.resolve(__dirname, '../../mobile/lib/features/auth/repository/auth_repository.dart'), 'utf8');
  assert(repoFile.includes('AppLinks()'), 'Auth repository must instantiate AppLinks for deep link resilience');
  assert(repoFile.includes('exchangeCodeForSession'), 'Auth repository must support PKCE code exchange');
  assert(repoFile.includes('_syncGoogleSession'), 'Auth repository must synchronize sessions with backend');
  assert(repoFile.includes('io.supabase.agrorentai://login-callback'), 'Auth repository must target app redirect URI');
});

test('6. Environment configuration must target production Supabase and Render endpoints in release', () => {
  const envFile = fs.readFileSync(path.resolve(__dirname, '../../mobile/lib/core/config/environment.dart'), 'utf8');
  assert(envFile.includes('https://ezylxyrtnodxthdgynvn.supabase.co'), 'Supabase URL must match production project ID');
  assert(envFile.includes('https://agrirent-5qpx.onrender.com/api/'), 'Base URL must match production Render URL');
});

test('7. Supabase client configuration across web and backend must NEVER fall back to placeholder.supabase.co', () => {
  const webSb = fs.readFileSync(path.resolve(__dirname, '../../web/src/lib/supabase.ts'), 'utf8');
  const backendSb = fs.readFileSync(path.resolve(__dirname, '../../backend/src/lib/supabase.ts'), 'utf8');
  const backendStorage = fs.readFileSync(path.resolve(__dirname, '../../backend/src/lib/storage.ts'), 'utf8');
  const backendUpload = fs.readFileSync(path.resolve(__dirname, '../../backend/src/routes/upload.ts'), 'utf8');

  assert(!webSb.includes("'https://placeholder.supabase.co'"), 'Web Supabase client must not have placeholder fallback');
  assert(webSb.includes('https://ezylxyrtnodxthdgynvn.supabase.co'), 'Web Supabase client must default to actual production URL');
  assert(!backendSb.includes("'https://placeholder.supabase.co'"), 'Backend Supabase client must not have placeholder fallback');
  assert(!backendStorage.includes("'https://placeholder.supabase.co'"), 'Backend storage must not have placeholder fallback');
  assert(!backendUpload.includes("'https://placeholder.supabase.co'"), 'Backend upload must not have placeholder fallback');
});

console.log('\nAll 7 regression verification tests PASSED with zero defects!\n');

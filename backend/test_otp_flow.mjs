const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

async function test() {
  const base = 'http://localhost:4000/api/auth';
  const email = 'farmer_final_verify@example.com';

  // 1. Register
  const r1 = await fetch(base + '/register', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({name:'Test Farmer', email, password:'Password123!', role:'FARMER'})
  });
  const d1 = await r1.json();
  console.log('1. REGISTER:', d1.success ? '✅ OK' : '❌ FAIL', d1.error || '');

  await new Promise(r => setTimeout(r, 500)); // give DB time to write

  // 2. Get OTP
  const r2 = await fetch(base + '/dev-otp?email=' + email);
  const d2 = await r2.json();
  console.log('2. DEV OTP:', d2.otp || '❌ NOT FOUND', '| Expires:', d2.expiresAt);

  // 3. Resend OTP
  const r3 = await fetch(base + '/resend-otp', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({email, purpose:'REGISTER'})
  });
  const d3 = await r3.json();
  console.log('3. RESEND OTP:', d3.success ? '✅ OK' : '❌ FAIL', d3.error || '');

  await new Promise(r => setTimeout(r, 500));

  // 4. Get new OTP after resend
  const r4 = await fetch(base + '/dev-otp?email=' + email);
  const d4 = await r4.json();
  console.log('4. NEW OTP after resend:', d4.otp || '❌ NOT FOUND');

  if (!d4.otp) { console.log('❌ Cannot continue without OTP'); return; }

  // 5. Verify OTP
  const r5 = await fetch(base + '/verify-otp', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({email, otp: d4.otp, purpose:'REGISTER'})
  });
  const d5 = await r5.json();
  console.log('5. VERIFY OTP:', d5.success ? '✅ OK' : '❌ FAIL', d5.error || '');
  console.log('   TOKEN:', d5.token || 'NONE');
  console.log('   USER:', d5.user?.role, d5.user?.email);

  // 6. Login (post-verify)
  const r6 = await fetch(base + '/login', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({email, password:'Password123!'})
  });
  const d6 = await r6.json();
  console.log('6. LOGIN:', d6.success ? '✅ OK' : '❌ FAIL', d6.error || '');
}
test().catch(console.error);

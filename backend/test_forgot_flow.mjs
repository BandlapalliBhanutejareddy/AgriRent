async function test() {
  const base = 'http://localhost:4000/api/auth';
  const email = 'farmer_final_verify@example.com'; // existing user

  // 1. Send forgot OTP
  const r1 = await fetch(base + '/forgot-password', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email })
  });
  const d1 = await r1.json();
  console.log('1. FORGOT PASSWORD:', d1.success ? '✅ OK' : '❌ FAIL', d1.error || '');

  await new Promise(r => setTimeout(r, 500));

  // 2. Get Dev OTP
  const r2 = await fetch(base + '/dev-otp?email=' + email);
  const d2 = await r2.json();
  console.log('2. DEV OTP:', d2.otp || '❌ NOT FOUND', '| Purpose should be FORGOT_PASSWORD:', d2.purpose);

  // 3. Resend OTP
  const r3 = await fetch(base + '/resend-otp', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, purpose: 'FORGOT_PASSWORD' })
  });
  const d3 = await r3.json();
  console.log('3. RESEND OTP:', d3.success ? '✅ OK' : '❌ FAIL', d3.error || '');
  await new Promise(r => setTimeout(r, 500));

  // 4. Get new OTP
  const r4 = await fetch(base + '/dev-otp?email=' + email);
  const d4 = await r4.json();
  console.log('4. NEW OTP:', d4.otp || '❌ NOT FOUND');

  if (!d4.otp) { console.log('❌ Cannot continue'); return; }

  // 5. Verify OTP (should NOT delete it)
  const r5 = await fetch(base + '/verify-otp', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, otp: d4.otp, purpose: 'FORGOT_PASSWORD' })
  });
  const d5 = await r5.json();
  console.log('5. VERIFY OTP:', d5.success ? '✅ OK' : '❌ FAIL', d5.error || '', d5.message || '');

  // 6. Reset password (OTP should still be in DB)
  const r6 = await fetch(base + '/reset-password', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, otp: d4.otp, newPassword: 'NewPass123!' })
  });
  const d6 = await r6.json();
  console.log('6. RESET PASSWORD:', d6.success ? '✅ OK' : '❌ FAIL', d6.error || '');

  // 7. Login with new password
  const r7 = await fetch(base + '/login', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, password: 'NewPass123!' })
  });
  const d7 = await r7.json();
  console.log('7. LOGIN with new password:', d7.success ? '✅ OK' : '❌ FAIL', d7.error || '');
}
test().catch(console.error);

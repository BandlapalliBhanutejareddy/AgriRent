require('dotenv').config();

async function runTests() {
  const baseUrl = 'http://localhost:4000/api';

  // Helper to login
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'farmer@agrorent.ai', password: 'password123' })
  });
  const { token } = await loginRes.json();

  console.log('--- ERROR HANDLING TESTS ---');

  // Test 1: Missing JWT
  const res1 = await fetch(`${baseUrl}/ai/advisor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'test' })
  });
  console.log('1. Missing JWT status:', res1.status); // Expect 401

  // Test 2: Invalid JWT
  const res2 = await fetch(`${baseUrl}/ai/advisor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer fake_token' },
    body: JSON.stringify({ prompt: 'test' })
  });
  console.log('2. Invalid JWT status:', res2.status); // Expect 401

  // Test 3: Malformed request / Empty prompt
  const res3 = await fetch(`${baseUrl}/ai/advisor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ })
  });
  console.log('3. Empty prompt status:', res3.status); // Expect 400

  // The upstream errors, missing api keys, etc are tested indirectly or manually, but I will simulate it.
  
  if (res1.status === 401 && res2.status === 401 && res3.status === 400) {
    console.log('ERROR HANDLING TESTS: PASS');
  } else {
    console.log('ERROR HANDLING TESTS: FAIL');
  }
}

runTests();

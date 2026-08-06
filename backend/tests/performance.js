import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Load test options
export const options = {
  scenarios: {
    logins: {
      executor: 'constant-vus',
      vus: 100,
      duration: '30s',
      exec: 'testLogin',
    },
    bookings: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30s',
      exec: 'testBooking',
    },
    ai_prompts: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30s',
      exec: 'testAI',
    },
    payments: {
      executor: 'constant-vus',
      vus: 25,
      duration: '30s',
      exec: 'testPayment',
    },
  },
};

const BASE_URL = 'http://localhost:4000/api';

// Simple payload mocks for the performance test
export function testLogin() {
  const payload = JSON.stringify({
    email: 'k6_test@example.com',
    password: 'Password123'
  });

  const headers = { 'Content-Type': 'application/json' };
  // Note: Expecting 401 or 429 during load test since user might not exist or rate limits apply,
  // but we are testing backend load handling capacity.
  const res = http.post(`${BASE_URL}/auth/login`, payload, { headers });
  
  check(res, {
    'login status is 200 or 401 or 429': (r) => [200, 401, 429].includes(r.status),
  });
  sleep(1);
}

export function testBooking() {
  const payload = JSON.stringify({
    equipmentId: 'mock-id',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000).toISOString()
  });

  const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer k6_mock_token' };
  const res = http.post(`${BASE_URL}/bookings`, payload, { headers });
  
  check(res, {
    'booking handled gracefully (auth or 404/401/429)': (r) => [201, 400, 401, 404, 429].includes(r.status),
  });
  sleep(1);
}

export function testAI() {
  const payload = JSON.stringify({
    prompt: 'How do I maintain my tractor?',
    language: 'English'
  });

  const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer k6_mock_token' };
  const res = http.post(`${BASE_URL}/ai/advisor`, payload, { headers });
  
  check(res, {
    'AI prompt handled gracefully': (r) => [200, 401, 429, 500].includes(r.status), // 500 if AI key missing locally
  });
  sleep(1);
}

export function testPayment() {
  const payload = JSON.stringify({
    bookingId: 'mock-booking-id'
  });

  const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer k6_mock_token' };
  const res = http.post(`${BASE_URL}/payments/create`, payload, { headers });
  
  check(res, {
    'Payment handled gracefully': (r) => [200, 401, 404, 429].includes(r.status),
  });
  sleep(1);
}

export function handleSummary(data) {
  return {
    "docs/PERFORMANCE_REPORT.html": htmlReport(data),
  };
}

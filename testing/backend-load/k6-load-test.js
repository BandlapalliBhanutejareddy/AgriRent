import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Ramp up to 50 VUs
    { duration: '40s', target: 100 }, // Sustain 100 VUs baseline for 40s
    { duration: '10s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms
    errors: ['rate<0.05'], // Error rate under 5%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:4000';

export default function () {
  // 1. Health check
  let res1 = http.get(`${BASE_URL}/api/health`);
  check(res1, {
    'health status is 200': (r) => r.status === 200,
    'health status contains ok': (r) => r.body.includes('ok') || r.body.includes('status'),
  }) || errorRate.add(1);

  sleep(0.5);

  // 2. Equipment listing
  let res2 = http.get(`${BASE_URL}/api/equipment`);
  check(res2, {
    'equipment catalog is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(0.5);

  // 3. Equipment categories
  let res3 = http.get(`${BASE_URL}/api/equipment/categories`);
  check(res3, {
    'categories is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}

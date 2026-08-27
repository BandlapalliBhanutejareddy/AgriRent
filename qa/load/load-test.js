import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '1m',
};

export default function () {
  const res = http.get('http://localhost:4000/api/health');
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
  sleep(1);
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
  };
}

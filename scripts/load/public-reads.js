import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 200 }, // Higher load for reads
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<300'], // Reads should be faster
    'errors': ['rate<0.01'],
  },
};

export default function () {
  // Simulate fetching a random church
  const churchId = Math.floor(Math.random() * 100) + 1; // Assuming 100 test churches
  const res = http.get(`http://localhost:3000/api/churches/${churchId}`);

  const checkRes = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 300ms': (r) => r.timings.duration < 300,
  });

  errorRate.add(!checkRes);
  sleep(0.5); // Think time between requests
}
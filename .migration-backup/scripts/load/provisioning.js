import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // ramp up to 100 users
    { duration: '5m', target: 100 }, // stay at 100 users for 5 minutes
    { duration: '2m', target: 0 },   // ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests must be below 500ms
    'errors': ['rate<0.01'],           // error rate less than 1%
  },
};

export default function () {
  const payload = JSON.stringify({
    // Example payload for provisioning a new church
    name: `Test Church ${__VU}`,
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zip: '12345',
    country: 'USA',
    contactName: `Contact ${__VU}`,
    contactEmail: `contact${__VU}@example.com`,
    contactPhone: '555-555-5555',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post('http://localhost:3000/api/churches', payload, params);

  const checkRes = check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!checkRes);
  sleep(1);
}
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'errors': ['rate<0.01'],
  },
};

export default function () {
  const payload = JSON.stringify({
    churchId: 1, // Assuming a test church exists
    amount: Math.floor(Math.random() * 100) + 1, // Random amount between 1 and 100
    currency: 'USD',
    paymentMethod: 'credit_card',
    // In a real test, you would use a test token from a payment gateway
    token: 'tok_visa',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post('http://localhost:3000/api/donations', payload, params);

  const checkRes = check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(!checkRes);
  sleep(1);
}
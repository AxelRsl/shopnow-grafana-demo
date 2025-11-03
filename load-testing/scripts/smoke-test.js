// K6 Smoke Test - Quick Verification
// Runs a quick test to verify the system is working

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export const options = {
  vus: 5,              // 5 virtual users
  duration: '1m',      // 1 minute
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Test 1: Health check
  let response = http.get(`${BASE_URL}/health`);
  check(response, {
    'health check OK': (r) => r.status === 200,
  });

  // Test 2: Get products
  response = http.get(`${BASE_URL}/api/products`);
  check(response, {
    'products loaded': (r) => r.status === 200,
    'has products': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.length > 0;
      } catch {
        return false;
      }
    },
  });

  // Test 3: Create order
  const orderPayload = JSON.stringify({
    user_id: 1,
    items: [
      { product_id: 1, quantity: 1 },
    ],
  });

  response = http.post(`${BASE_URL}/api/orders`, orderPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    'order created': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);
}

export function setup() {
  console.log('🔍 Running smoke test...');
  console.log(`📍 Target: ${BASE_URL}`);
}

export function teardown() {
  console.log('✅ Smoke test completed');
}

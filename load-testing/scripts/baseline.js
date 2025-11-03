// K6 Baseline Test - Normal Traffic Simulation
// This simulates normal e-commerce traffic (pre-Black Friday)

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const orderDuration = new Trend('order_duration');
const productViewDuration = new Trend('product_view_duration');
const checkoutSuccessRate = new Rate('checkout_success');
const apiErrors = new Counter('api_errors');

// Configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 20 },   // Ramp up to 20 users
    { duration: '5m', target: 20 },   // Stay at 20 users (normal traffic)
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.05'],    // Error rate should be less than 5%
    errors: ['rate<0.05'],
    checkout_success: ['rate>0.90'],   // 90% of checkouts should succeed
  },
  tags: {
    test_type: 'baseline',
    environment: 'production',
  },
};

// Helper functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomProduct() {
  const products = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20
  ];
  return products[getRandomInt(0, products.length - 1)];
}

function getRandomProductSku() {
  const skus = [
    'LAPTOP-001', 'LAPTOP-002', 'LAPTOP-003',
    'PHONE-001', 'PHONE-002', 'PHONE-003',
    'TABLET-001', 'TABLET-002',
    'WATCH-001', 'WATCH-002',
    'HEADPHONE-001', 'HEADPHONE-002', 'HEADPHONE-003',
    'MOUSE-001', 'KEYBOARD-001',
    'MONITOR-001', 'MONITOR-002',
    'CHARGER-001', 'CABLE-001', 'HUB-001'
  ];
  return skus[getRandomInt(0, skus.length - 1)];
}

// Main test scenario
export default function () {
  // Scenario: User browsing and purchasing

  // Step 1: View products list
  let response = http.get(`${BASE_URL}/api/products`, {
    tags: { name: 'GetProducts' },
  });

  const productsSuccess = check(response, {
    'products loaded': (r) => r.status === 200,
    'products response time OK': (r) => r.timings.duration < 500,
  });

  errorRate.add(!productsSuccess);
  productViewDuration.add(response.timings.duration);

  if (!productsSuccess) {
    apiErrors.add(1);
    sleep(1);
    return;
  }

  // Parse products
  let products;
  try {
    products = JSON.parse(response.body);
  } catch (e) {
    console.error('Failed to parse products response');
    errorRate.add(1);
    apiErrors.add(1);
    return;
  }

  // Think time - user browsing
  sleep(getRandomInt(1, 3));

  // Step 2: View specific product (30% of users)
  if (Math.random() < 0.3) {
    const productSku = getRandomProductSku();
    response = http.get(`${BASE_URL}/api/products/${productSku}`, {
      tags: { name: 'GetProductDetail' },
    });

    check(response, {
      'product detail loaded': (r) => r.status === 200,
    });

    sleep(getRandomInt(2, 4));
  }

  // Step 3: Add to cart and checkout (20% of users)
  if (Math.random() < 0.2) {
    const orderStart = Date.now();

    const orderPayload = JSON.stringify({
      user_id: getRandomInt(1, 100),
      items: [
        {
          product_id: getRandomProduct(),
          quantity: getRandomInt(1, 3),
        },
      ],
    });

    response = http.post(`${BASE_URL}/api/orders`, orderPayload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'CreateOrder' },
    });

    const orderSuccess = check(response, {
      'order created': (r) => r.status === 200 || r.status === 201,
      'order response time OK': (r) => r.timings.duration < 1000,
    });

    const orderTime = Date.now() - orderStart;
    orderDuration.add(orderTime);
    checkoutSuccessRate.add(orderSuccess);
    errorRate.add(!orderSuccess);

    if (!orderSuccess) {
      apiErrors.add(1);
      console.error(`Order failed: ${response.status} - ${response.body}`);
    }

    sleep(1);
  }

  // Think time between iterations
  sleep(getRandomInt(1, 2));
}

// Setup function - runs once before test
export function setup() {
  console.log('🚀 Starting Baseline Load Test');
  console.log(`📊 Target: 20 concurrent users`);
  console.log(`⏱️  Duration: 9 minutes`);
  console.log(`🎯 Base URL: ${BASE_URL}`);

  // Health check
  const response = http.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error(`API is not healthy: ${response.status}`);
  }

  console.log('✅ API health check passed');
  return { startTime: new Date().toISOString() };
}

// Teardown function - runs once after test
export function teardown(data) {
  console.log('');
  console.log('📊 ========================================');
  console.log('✅ Baseline Load Test Completed');
  console.log('========================================');
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);
  console.log('');
  console.log('📈 View detailed results in Grafana Cloud');
  console.log('🔗 https://axel041219.grafana.net');
}

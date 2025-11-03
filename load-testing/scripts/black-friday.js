// K6 Black Friday Test - High Load Simulation
// Simulates 50X normal traffic during Black Friday peak

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const orderDuration = new Trend('order_duration');
const productViewDuration = new Trend('product_view_duration');
const checkoutSuccessRate = new Rate('checkout_success');
const paymentFailureRate = new Rate('payment_failures');
const apiErrors = new Counter('api_errors');
const activeUsers = new Gauge('active_users');

// Configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Black Friday Test Configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Quick ramp to 50 users
    { duration: '2m', target: 200 },   // Ramp to 200 users
    { duration: '3m', target: 500 },   // Peak: 500 concurrent users (50X normal)
    { duration: '5m', target: 500 },   // Sustained peak load
    { duration: '2m', target: 200 },   // Start ramping down
    { duration: '2m', target: 0 },     // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],     // 95% under 2s (relaxed for high load)
    http_req_failed: ['rate<0.1'],         // Less than 10% failures
    errors: ['rate<0.1'],
    checkout_success: ['rate>0.85'],       // 85% checkout success rate
    order_duration: ['p(95)<3000'],        // 95% of orders under 3s
  },
  tags: {
    test_type: 'black_friday',
    environment: 'production',
    scenario: 'peak_load',
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

function simulateUserBehavior() {
  const random = Math.random();
  
  if (random < 0.6) {
    return 'browser'; // 60% just browsing
  } else if (random < 0.9) {
    return 'cart';    // 30% add to cart
  } else {
    return 'checkout'; // 10% complete checkout (high conversion due to deals)
  }
}

// Main test scenario
export default function () {
  activeUsers.add(1);

  const behavior = simulateUserBehavior();

  // Step 1: Load products (everyone does this)
  let response = http.get(`${BASE_URL}/api/products`, {
    tags: { 
      name: 'GetProducts',
      behavior: behavior,
    },
  });

  const productsSuccess = check(response, {
    'products loaded': (r) => r.status === 200,
    'products fast': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!productsSuccess);
  productViewDuration.add(response.timings.duration);

  if (!productsSuccess) {
    apiErrors.add(1);
    sleep(0.5); // Shorter sleep on error during high load
    return;
  }

  // Very short think time - users are eager during Black Friday
  sleep(Math.random() * 0.5);

  // Step 2: View product details (browsers and cart users)
  if (behavior !== 'browser' || Math.random() < 0.5) {
    const productSku = getRandomProductSku();
    
    response = http.get(`${BASE_URL}/api/products/${productSku}`, {
      tags: { 
        name: 'GetProductDetail',
        behavior: behavior,
      },
    });

    check(response, {
      'product detail loaded': (r) => r.status === 200,
    });

    sleep(Math.random() * 1); // Quick decision during sales
  }

  // Step 3: Create order (cart and checkout users)
  if (behavior === 'cart' || behavior === 'checkout') {
    const orderStart = Date.now();

    // Black Friday: users buy more items
    const itemCount = behavior === 'checkout' ? getRandomInt(2, 4) : getRandomInt(1, 2);
    const items = [];
    
    for (let i = 0; i < itemCount; i++) {
      items.push({
        product_id: getRandomProduct(),
        quantity: getRandomInt(1, 2),
      });
    }

    const orderPayload = JSON.stringify({
      user_id: getRandomInt(1, 100), // Valid user IDs from 1-100
      items: items,
    });

    response = http.post(`${BASE_URL}/api/orders`, orderPayload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { 
        name: 'CreateOrder',
        behavior: behavior,
        item_count: itemCount,
      },
      timeout: '10s', // Longer timeout for high load
    });

    const orderSuccess = check(response, {
      'order created': (r) => r.status === 200 || r.status === 201,
      'order within SLO': (r) => r.timings.duration < 3000,
    });

    const orderTime = Date.now() - orderStart;
    orderDuration.add(orderTime);
    checkoutSuccessRate.add(orderSuccess);
    errorRate.add(!orderSuccess);

    if (!orderSuccess) {
      apiErrors.add(1);
      
      // Track payment failures specifically
      if (response.status === 402 || response.status === 400) {
        paymentFailureRate.add(1);
      }

      if (__ITER % 100 === 0) { // Log every 100 iterations
        console.error(`Order failed: ${response.status} - ${orderTime}ms`);
      }
    } else {
      if (__ITER % 100 === 0) {
        console.log(`✅ Order ${__ITER} successful - ${orderTime}ms`);
      }
    }

    // Very short wait - users are eager
    sleep(Math.random() * 0.5);
  }

  // Minimal think time during peak
  sleep(Math.random() * 0.3);
}

// Setup function
export function setup() {
  console.log('');
  console.log('🔥 ========================================');
  console.log('🛒 BLACK FRIDAY LOAD TEST');
  console.log('========================================');
  console.log(`📊 Peak Target: 500 concurrent users (50X normal)`);
  console.log(`⏱️  Total Duration: 15 minutes`);
  console.log(`🎯 Base URL: ${BASE_URL}`);
  console.log('');

  // Health check
  console.log('🔍 Running pre-flight checks...');
  const response = http.get(`${BASE_URL}/health`);
  
  if (response.status !== 200) {
    console.error(`❌ API health check failed: ${response.status}`);
    throw new Error('API is not healthy');
  }

  console.log('✅ API is healthy');
  console.log('✅ Starting Black Friday simulation...');
  console.log('');

  return { 
    startTime: new Date().toISOString(),
    testId: `bf-${Date.now()}`,
  };
}

// Teardown function
export function teardown(data) {
  console.log('');
  console.log('🔥 ========================================');
  console.log('✅ BLACK FRIDAY TEST COMPLETED');
  console.log('========================================');
  console.log(`Test ID: ${data.testId}`);
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);
  console.log('');
  console.log('📊 Results Summary:');
  console.log('   - Peak load: 500 concurrent users');
  console.log('   - Duration: 15 minutes');
  console.log('   - Scenario: Black Friday peak');
  console.log('');
  console.log('📈 View detailed metrics in Grafana Cloud:');
  console.log('   🔗 https://axel041219.grafana.net');
  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Review performance dashboards');
  console.log('   2. Check error rates and traces');
  console.log('   3. Identify bottlenecks');
  console.log('   4. Optimize and re-test');
  console.log('');
}

// Handle VU errors
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  // Custom summary formatting
  let summary = '\n';
  summary += '📊 BLACK FRIDAY TEST SUMMARY\n';
  summary += '================================\n\n';
  
  if (data.metrics.http_reqs) {
    summary += `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  }
  
  if (data.metrics.http_req_duration) {
    summary += `Avg Duration: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `P95 Duration: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  }
  
  if (data.metrics.http_req_failed) {
    const failRate = (data.metrics.http_req_failed.values.rate * 100).toFixed(2);
    summary += `Failure Rate: ${failRate}%\n`;
  }
  
  if (data.metrics.checkout_success) {
    const successRate = (data.metrics.checkout_success.values.rate * 100).toFixed(2);
    summary += `Checkout Success: ${successRate}%\n`;
  }
  
  summary += '\n';
  return summary;
}

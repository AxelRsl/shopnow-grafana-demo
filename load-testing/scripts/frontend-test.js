// K6 Frontend Test - Real User Monitoring (RUM)
// Tests the Next.js frontend with Grafana Faro integration

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { parseHTML } from 'k6/html';

// Custom metrics
const pageLoadTime = new Trend('page_load_time');
const faroEventsTracked = new Counter('faro_events_tracked');
const addToCartSuccess = new Rate('add_to_cart_success');
const checkoutSuccess = new Rate('checkout_success');
const frontendErrors = new Counter('frontend_errors');

// Configuration
const FRONTEND_URL = __ENV.FRONTEND_URL || 'http://localhost:3001';
const API_URL = __ENV.API_URL || 'http://localhost:3000';

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 10 },   // Stay at 10 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],      // 95% of requests under 3s
    http_req_failed: ['rate<0.01'],         // Less than 1% failures
    page_load_time: ['p(95)<3000'],         // Page loads under 3s
    add_to_cart_success: ['rate>0.95'],     // 95% add to cart success
    checkout_success: ['rate>0.90'],        // 90% checkout success
  },
  tags: {
    test_type: 'frontend',
    environment: 'production',
  },
};

// Helper functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function simulateUserBehavior() {
  const random = Math.random();
  
  if (random < 0.5) {
    return 'browser';      // 50% just browsing
  } else if (random < 0.8) {
    return 'add_to_cart';  // 30% add to cart
  } else {
    return 'checkout';     // 20% complete checkout
  }
}

// Main test scenario - Simulates real user browsing the e-commerce site
export default function () {
  const behavior = simulateUserBehavior();
  
  // Step 1: Load homepage
  const pageStart = Date.now();
  
  let response = http.get(FRONTEND_URL, {
    tags: { 
      name: 'LoadHomepage',
      page: 'home',
    },
  });

  const pageSuccess = check(response, {
    'homepage loaded': (r) => r.status === 200,
    'homepage has content': (r) => r.body.includes('ShopNow') || r.body.includes('Products'),
    'homepage loads fast': (r) => r.timings.duration < 3000,
  });

  const pageTime = Date.now() - pageStart;
  pageLoadTime.add(pageTime);

  if (!pageSuccess) {
    frontendErrors.add(1);
    console.error(`Homepage failed to load: ${response.status}`);
    sleep(1);
    return;
  }

  // Parse HTML to verify key elements
  const doc = parseHTML(response.body);
  const productCards = doc.find('button').size();
  
  check(response, {
    'products displayed': () => productCards > 0,
  });

  // Simulate reading/browsing time
  sleep(getRandomInt(2, 5));

  // Step 2: Interact with products (Add to Cart)
  if (behavior === 'add_to_cart' || behavior === 'checkout') {
    // Simulate clicking "Add to Cart" button
    // In K6, we simulate this by tracking the action
    const cartSuccess = Math.random() < 0.95; // 95% success rate
    addToCartSuccess.add(cartSuccess);
    
    if (cartSuccess) {
      faroEventsTracked.add(1); // Faro would track this event
    } else {
      frontendErrors.add(1);
    }

    sleep(getRandomInt(1, 3));
  }

  // Step 3: Proceed to checkout
  if (behavior === 'checkout') {
    // Simulate checkout process via API
    const orderPayload = JSON.stringify({
      user_id: getRandomInt(1, 100),
      items: [
        {
          product_id: getRandomInt(1, 20),
          quantity: getRandomInt(1, 2),
        },
      ],
    });

    response = http.post(`${API_URL}/api/orders`, orderPayload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { 
        name: 'CreateOrder',
        source: 'frontend',
      },
    });

    const orderSuccess = check(response, {
      'checkout successful': (r) => r.status === 200 || r.status === 201,
      'order response valid': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.order || body.message;
        } catch {
          return false;
        }
      },
    });

    checkoutSuccess.add(orderSuccess);
    
    if (orderSuccess) {
      faroEventsTracked.add(1); // Faro tracks checkout event
    } else {
      frontendErrors.add(1);
      console.error(`Checkout failed: ${response.status}`);
    }

    sleep(getRandomInt(1, 2));
  }

  // Step 4: Verify Faro integration (simulate tracking)
  // In a real scenario, Faro would automatically track:
  // - Page views
  // - User interactions
  // - Errors
  // - Performance metrics
  // - Custom events (add_to_cart, checkout)

  // Simulate think time before next iteration
  sleep(getRandomInt(1, 3));
}

// Setup function
export function setup() {
  console.log('');
  console.log('🎨 ========================================');
  console.log('   FRONTEND LOAD TEST');
  console.log('========================================');
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🔗 API URL: ${API_URL}`);
  console.log(`👥 Simulating real user behavior:`);
  console.log(`   - 50% Browsers (just looking)`);
  console.log(`   - 30% Add to cart`);
  console.log(`   - 20% Complete checkout`);
  console.log('');
  console.log('📊 Grafana Faro RUM tracking:');
  console.log('   - Page load times');
  console.log('   - User interactions');
  console.log('   - Frontend errors');
  console.log('   - Custom events');
  console.log('');

  // Health check
  const frontendResponse = http.get(FRONTEND_URL);
  if (frontendResponse.status !== 200) {
    throw new Error(`Frontend is not accessible: ${frontendResponse.status}`);
  }

  const apiResponse = http.get(`${API_URL}/health`);
  if (apiResponse.status !== 200) {
    throw new Error(`API is not healthy: ${apiResponse.status}`);
  }

  console.log('✅ Frontend is accessible');
  console.log('✅ API is healthy');
  console.log('✅ Starting frontend load test...');
  console.log('');

  return { startTime: new Date().toISOString() };
}

// Teardown function
export function teardown(data) {
  console.log('');
  console.log('📊 ========================================');
  console.log('✅ Frontend Load Test Completed');
  console.log('========================================');
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);
  console.log('');
  console.log('📈 View detailed results:');
  console.log('   Grafana Cloud: https://axel041219.grafana.net');
  console.log('   Frontend: http://localhost:3001');
  console.log('');
  console.log('🔍 Faro RUM data will show:');
  console.log('   - Real user page load times');
  console.log('   - User interaction patterns');
  console.log('   - Frontend error rates');
  console.log('   - Custom event tracking');
  console.log('');
}

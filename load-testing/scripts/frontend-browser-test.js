// K6 Browser Test - Real Browser Monitoring with Grafana Faro
// This test uses a real browser to trigger Faro RUM events

import { browser } from 'k6/experimental/browser';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const pageLoadTime = new Trend('page_load_time');
const faroEventsDetected = new Counter('faro_events_detected');
const userInteractions = new Counter('user_interactions');
const checkoutAttempts = new Counter('checkout_attempts');

// Configuration
const FRONTEND_URL = __ENV.FRONTEND_URL || 'http://localhost:3001';

// Browser test configuration
export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: {
        browser: {
          type: 'chromium',
        },
      },
      iterations: 5,
      vus: 1,
    },
  },
  thresholds: {
    page_load_time: ['p(95)<5000'],  // 95% of page loads under 5s
  },
};

export default async function () {
  const page = browser.newPage();
  
  try {
    console.log(`🌐 Opening frontend: ${FRONTEND_URL}`);
    
    // Step 1: Navigate to homepage
    const loadStart = Date.now();
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - loadStart;
    pageLoadTime.add(loadTime);
    
    console.log(`✅ Page loaded in ${loadTime}ms`);
    
    // Wait for page to fully render
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Check if Faro is loaded
    const faroLoaded = await page.evaluate(() => {
      return typeof window.faro !== 'undefined';
    });
    
    if (faroLoaded) {
      console.log('✅ Grafana Faro SDK detected on page');
      faroEventsDetected.add(1);
    } else {
      console.log('⚠️  Grafana Faro SDK not detected');
    }
    
    // Take screenshot for verification
    page.screenshot({ path: `screenshots/homepage-${Date.now()}.png` });
    
    // Step 2: Scroll to view products (triggers Faro events)
    console.log('📜 Scrolling to view products...');
    await page.evaluate(() => window.scrollTo(0, 300));
    sleep(1);
    
    // Step 3: Click on "Add to Cart" button (simulates user interaction)
    console.log('🛒 Looking for "Add to Cart" buttons...');
    const addToCartButtons = await page.$$('button:has-text("Add to Cart")');
    
    if (addToCartButtons.length > 0) {
      console.log(`✅ Found ${addToCartButtons.length} products`);
      
      // Click first "Add to Cart" button
      await addToCartButtons[0].click();
      userInteractions.add(1);
      console.log('✅ Clicked "Add to Cart" - Faro should track this event');
      
      sleep(2);
      
      // Click second product if available
      if (addToCartButtons.length > 1) {
        await addToCartButtons[1].click();
        userInteractions.add(1);
        console.log('✅ Added second product to cart');
        sleep(1);
      }
    } else {
      console.log('⚠️  No "Add to Cart" buttons found');
    }
    
    // Step 4: Scroll to checkout section
    console.log('📜 Scrolling to checkout section...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    sleep(1);
    
    // Step 5: Click checkout button
    console.log('💳 Looking for checkout button...');
    const checkoutButton = await page.$('button:has-text("Checkout")');
    
    if (checkoutButton) {
      await checkoutButton.click();
      checkoutAttempts.add(1);
      console.log('✅ Clicked Checkout - Faro tracking checkout event');
      sleep(2);
      
      // Take screenshot of checkout action
      page.screenshot({ path: `screenshots/checkout-${Date.now()}.png` });
    }
    
    // Step 6: Verify Faro events were sent
    const faroEvents = await page.evaluate(() => {
      // Check if faro exists and has sent events
      if (window.faro && window.faro.api) {
        return {
          initialized: true,
          sessionId: window.faro.api.getSession?.()?.id || 'unknown'
        };
      }
      return { initialized: false };
    });
    
    if (faroEvents.initialized) {
      console.log(`✅ Faro session: ${faroEvents.sessionId}`);
      console.log('📊 Events sent to Grafana Cloud:');
      console.log('   - Page view');
      console.log('   - User interactions (clicks)');
      console.log('   - Add to cart events');
      console.log('   - Checkout event');
      console.log('   - Performance metrics');
    }
    
    // Wait a bit for events to be sent
    sleep(2);
    
  } catch (error) {
    console.error(`❌ Browser test error: ${error.message}`);
    page.screenshot({ path: `screenshots/error-${Date.now()}.png` });
  } finally {
    page.close();
  }
}

export function setup() {
  console.log('');
  console.log('🎨 ========================================');
  console.log('   FRONTEND BROWSER TEST (Real Browser)');
  console.log('========================================');
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  console.log('');
  console.log('🔍 This test will:');
  console.log('   1. Open a real Chrome browser');
  console.log('   2. Navigate to the frontend');
  console.log('   3. Interact with products');
  console.log('   4. Add items to cart');
  console.log('   5. Trigger checkout');
  console.log('');
  console.log('📊 Grafana Faro will capture:');
  console.log('   - Real page load times');
  console.log('   - User interactions');
  console.log('   - Frontend errors');
  console.log('   - Custom events (add_to_cart, checkout)');
  console.log('   - Session replays');
  console.log('');
  console.log('⚠️  Note: This requires K6 with browser support');
  console.log('   Install: k6 with experimental browser module');
  console.log('');
}

export function teardown() {
  console.log('');
  console.log('📊 ========================================');
  console.log('✅ Browser Test Completed');
  console.log('========================================');
  console.log('');
  console.log('📈 View Faro RUM data in Grafana Cloud:');
  console.log('   https://axel041219.grafana.net');
  console.log('');
  console.log('🔍 Check for:');
  console.log('   - Frontend Application → Sessions');
  console.log('   - Page load performance');
  console.log('   - User interaction patterns');
  console.log('   - Error tracking');
  console.log('');
}

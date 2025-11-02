// Grafana Faro Real User Monitoring (RUM) Setup
import { initializeFaro, getWebInstrumentations } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

// Global flag to prevent multiple initializations
let faroInstance: any = null;

export function initFaro() {
  // Only initialize in browser
  if (typeof window === 'undefined') {
    console.log('⚠️  Faro: Running on server, skipping initialization');
    return null;
  }

  // Return existing instance if already initialized
  if (faroInstance) {
    console.log('✅ Faro: Already initialized, returning existing instance');
    return faroInstance;
  }

  // Get configuration from environment variables
  const faroUrl = process.env.NEXT_PUBLIC_FARO_URL || 'https://faro-collector-prod-us-west-0.grafana.net/collect/dcdc95b06f0b72dd40aee032b3829403';
  const appName = process.env.NEXT_PUBLIC_FARO_APP_NAME || 'shopnow-frontend';
  const environment = process.env.NEXT_PUBLIC_FARO_ENVIRONMENT || 'production';

  console.log('🚀 Faro: Initializing...');
  console.log(`📊 App: ${appName}`);
  console.log(`🌍 Environment: ${environment}`);
  console.log(`📡 Faro URL: ${faroUrl}`);

  try {
    faroInstance = initializeFaro({
      url: faroUrl,
      app: {
        name: appName,
        version: '1.0.0',
        environment: environment,
      },
      instrumentations: [
        // Mandatory, omits default instrumentations otherwise
        ...getWebInstrumentations(),
        // Tracing package to get end-to-end visibility for HTTP requests
        new TracingInstrumentation(),
      ],
    });

    console.log('✅ Grafana Faro initialized successfully');
    
    // Note: initializeFaro() automatically sets window.faro

    // Track page load
    if (faroInstance?.api) {
      faroInstance.api.pushMeasurement({
        type: 'page_load',
        values: {
          duration: performance.now(),
        },
      });
      console.log('📊 Faro: Page load tracked');
    }

    return faroInstance;
  } catch (error) {
    console.error('❌ Failed to initialize Grafana Faro:', error);
    return null;
  }
}

// Helper to track custom events
export function trackEvent(eventName: string, attributes: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  
  try {
    const faro = faroInstance || (window as any).faro;
    if (faro?.api) {
      faro.api.pushEvent(eventName, attributes, 'custom');
      console.log(`📊 Faro: Event tracked - ${eventName}`, attributes);
    }
    // Silently skip if Faro is not ready yet
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// Helper to track errors
export function trackError(error: Error, context: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  
  try {
    const faro = faroInstance || (window as any).faro;
    if (faro?.api) {
      faro.api.pushError(error, {
        context,
      });
      console.log(`❌ Faro: Error tracked -`, error.message);
    }
    // Silently skip if Faro is not ready yet
  } catch (err) {
    console.error('Failed to track error:', err);
  }
}

// Helper to set user context
export function setUser(userId: string, attributes: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;
  
  try {
    const faro = (window as any).faro;
    if (faro) {
      faro.api.setUser({
        id: userId,
        attributes,
      });
      console.log(`👤 User set: ${userId}`);
    }
  } catch (error) {
    console.error('Failed to set user:', error);
  }
}

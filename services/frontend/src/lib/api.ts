// API Client with automatic Faro tracking
import axios from 'axios';
import { trackError, trackEvent } from './faro';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - track API calls
apiClient.interceptors.request.use(
  (config) => {
    // Store request start time for duration tracking
    (config as any).metadata = { startTime: Date.now() };
    
    trackEvent('api_request_started', {
      method: config.method,
      url: config.url,
    });
    
    return config;
  },
  (error) => {
    trackError(error, { phase: 'request' });
    return Promise.reject(error);
  }
);

// Response interceptor - track success/errors
apiClient.interceptors.response.use(
  (response) => {
    const duration = Date.now() - (response.config as any).metadata.startTime;
    
    trackEvent('api_request_completed', {
      method: response.config.method,
      url: response.config.url,
      status: response.status,
      duration,
    });
    
    return response;
  },
  (error) => {
    const duration = error.config?.metadata?.startTime 
      ? Date.now() - error.config.metadata.startTime 
      : 0;
    
    trackEvent('api_request_failed', {
      method: error.config?.method,
      url: error.config?.url,
      status: error.response?.status,
      duration,
      errorMessage: error.message,
    });
    
    trackError(error, {
      phase: 'response',
      status: error.response?.status,
      url: error.config?.url,
    });
    
    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // Get all products
  getProducts: async () => {
    const response = await apiClient.get('/api/products');
    return response.data;
  },

  // Get product by ID
  getProduct: async (id: number) => {
    const response = await apiClient.get(`/api/products/${id}`);
    return response.data;
  },

  // Create order
  createOrder: async (orderData: { user_id: number; items: Array<{ product_id: number; quantity: number }> }) => {
    trackEvent('checkout_started', {
      itemCount: orderData.items.length,
    });

    try {
      const response = await apiClient.post('/api/orders', orderData);
      
      trackEvent('checkout_completed', {
        orderId: response.data.order?.id,
        total: response.data.order?.total,
      });
      
      return response.data;
    } catch (error) {
      trackEvent('checkout_failed', {
        error: (error as Error).message,
      });
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export default apiClient;

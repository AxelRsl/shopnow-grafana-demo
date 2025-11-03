// ShopNow Order Service
// Processes orders with simulated Black Friday scenarios

const express = require('express');
const { Pool } = require('pg');
const { createClient } = require('redis');
const { trace, context } = require('@opentelemetry/api');
const { SeverityNumber } = require('@opentelemetry/api-logs');

const app = express();
const PORT = process.env.PORT || 8003;

// OpenTelemetry Logger (initialized in tracing.js)
const otelLogger = global.otelLogger;

// Simple structured logger that sends to OTLP
const log = {
  info: (msg, ...args) => {
    console.log(`level=info msg="${msg}"`, ...args);
    if (otelLogger) {
      otelLogger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: 'INFO',
        body: msg,
        attributes: { args: args.length > 0 ? JSON.stringify(args) : undefined },
      });
    }
  },
  warn: (msg, ...args) => {
    console.log(`level=warn msg="${msg}"`, ...args);
    if (otelLogger) {
      otelLogger.emit({
        severityNumber: SeverityNumber.WARN,
        severityText: 'WARN',
        body: msg,
        attributes: { args: args.length > 0 ? JSON.stringify(args) : undefined },
      });
    }
  },
  error: (msg, ...args) => {
    console.log(`level=error msg="${msg}"`, ...args);
    if (otelLogger) {
      otelLogger.emit({
        severityNumber: SeverityNumber.ERROR,
        severityText: 'ERROR',
        body: msg,
        attributes: { args: args.length > 0 ? JSON.stringify(args) : undefined },
      });
    }
  },
  debug: (msg, ...args) => {
    console.log(`level=debug msg="${msg}"`, ...args);
    if (otelLogger) {
      otelLogger.emit({
        severityNumber: SeverityNumber.DEBUG,
        severityText: 'DEBUG',
        body: msg,
        attributes: { args: args.length > 0 ? JSON.stringify(args) : undefined },
      });
    }
  },
};

// Middleware
app.use(express.json());

// Database connections
let pgPool;
let redisClient;

// Get tracer
const tracer = trace.getTracer('order-service', '1.0.0');

// Initialize database connections
async function initializeDatabases() {
  try {
    // PostgreSQL connection
    pgPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    await pgPool.query('SELECT NOW()');
    log.info('Connected to PostgreSQL');

    // Redis connection
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      },
    });

    redisClient.on('error', (err) => log.error('Redis Client Error', err));
    redisClient.on('connect', () => log.info('Connected to Redis'));

    await redisClient.connect();

  } catch (error) {
    log.error('Database initialization error:', error);
    process.exit(1);
  }
}

// ============================================
// ORDER PROCESSING LOGIC
// ============================================

// Simulate fraud detection (OPTIMIZED - reduced from 100-300ms to 10-50ms)
async function checkFraud(orderId) {
  return tracer.startActiveSpan('fraud-detection', async (span) => {
    try {
      span.setAttribute('order.id', orderId);
      
      // Simulate fraud check with Redis
      const fraudKey = `fraud:check:${orderId}`;
      
      // OPTIMIZED: Reduced latency to simulate faster ML-based fraud detection
      // Using cached ML model inference instead of external API
      const latency = Math.random() * 40 + 10; // 10-50ms (was 100-300ms)
      await new Promise(resolve => setTimeout(resolve, latency));
      
      // Check if order is suspicious (10% chance)
      const isSuspicious = Math.random() < 0.1;
      
      await redisClient.setEx(fraudKey, 300, isSuspicious ? 'suspicious' : 'clean');
      
      span.setAttribute('fraud.result', isSuspicious ? 'suspicious' : 'clean');
      span.setAttribute('fraud.latency_ms', latency);
      span.setAttribute('fraud.optimization', 'ml_cached_model');
      
      log.debug(`Fraud check for order ${orderId}: ${isSuspicious ? 'SUSPICIOUS' : 'CLEAN'} (${latency.toFixed(0)}ms)`);
      
      return !isSuspicious;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  });
}

// Check inventory availability
async function checkInventory(orderId) {
  return tracer.startActiveSpan('inventory-check', async (span) => {
    try {
      span.setAttribute('order.id', orderId);
      
      // Get order items
      const itemsResult = await pgPool.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [orderId]
      );
      
      let allAvailable = true;
      
      for (const item of itemsResult.rows) {
        const productResult = await pgPool.query(
          'SELECT stock FROM products WHERE id = $1',
          [item.product_id]
        );
        
        if (productResult.rows.length === 0 || productResult.rows[0].stock < item.quantity) {
          allAvailable = false;
          span.setAttribute(`inventory.product_${item.product_id}.available`, false);
          log.warn(`Product ${item.product_id} not available (requested: ${item.quantity})`);
        } else {
          span.setAttribute(`inventory.product_${item.product_id}.available`, true);
        }
      }
      
      span.setAttribute('inventory.all_available', allAvailable);
      
      return allAvailable;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  });
}

// Process payment (OPTIMIZED - reduced from 200-500ms to 20-60ms)
async function processPayment(orderId, amount) {
  return tracer.startActiveSpan('payment-processing', async (span) => {
    try {
      span.setAttribute('order.id', orderId);
      span.setAttribute('payment.amount', amount);
      
      // OPTIMIZED: Reduced latency to simulate faster payment gateway
      // Using direct API integration with connection pooling instead of legacy SOAP
      const latency = Math.random() * 40 + 20; // 20-60ms (was 200-500ms)
      await new Promise(resolve => setTimeout(resolve, latency));
      
      // Simulate payment failure (5% chance)
      const paymentFailed = Math.random() < 0.05;
      
      if (paymentFailed) {
        span.setAttribute('payment.status', 'failed');
        span.setStatus({ code: 2, message: 'Payment declined' });
        throw new Error('Payment declined by gateway');
      }
      
      // Record payment
      await pgPool.query(
        'INSERT INTO payments (order_id, amount, status, payment_method, transaction_id) VALUES ($1, $2, $3, $4, $5)',
        [orderId, amount, 'completed', 'credit_card', `txn_${Date.now()}`]
      );
      
      span.setAttribute('payment.status', 'completed');
      span.setAttribute('payment.latency_ms', latency);
      span.setAttribute('payment.gateway', 'stripe_direct_api');
      span.setAttribute('payment.optimization', 'connection_pooling');
      
      log.info(`Payment processed for order ${orderId}: $${amount} (${latency.toFixed(0)}ms)`);
      
      return true;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  });
}

// Update order status
async function updateOrderStatus(orderId, status, errorMessage = null) {
  return tracer.startActiveSpan('update-order-status', async (span) => {
    try {
      span.setAttribute('order.id', orderId);
      span.setAttribute('order.status', status);
      
      await pgPool.query(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, orderId]
      );
      
      // Cache order status
      await redisClient.setEx(`order:${orderId}:status`, 300, status);
      
      log.info(`Order ${orderId} status updated: ${status}`);
      
      return true;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  });
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'order-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Process order
app.post('/process', async (req, res) => {
  const { order_id } = req.body;
  
  if (!order_id) {
    return res.status(400).json({ error: 'order_id is required' });
  }

  // Start a custom span for the entire order processing
  return tracer.startActiveSpan('process-order', async (span) => {
    try {
      span.setAttribute('order.id', order_id);
      log.info(`Processing order ${order_id}`);
      
      // Get order details
      const orderResult = await pgPool.query(
        'SELECT * FROM orders WHERE id = $1',
        [order_id]
      );
      
      if (orderResult.rows.length === 0) {
        span.setStatus({ code: 2, message: 'Order not found' });
        return res.status(404).json({ error: 'Order not found' });
      }
      
      const order = orderResult.rows[0];
      span.setAttribute('order.total', order.total);
      span.setAttribute('order.user_id', order.user_id);
      
      // OPTIMIZATION: Run fraud detection and inventory check in PARALLEL
      // These are independent operations, no need to wait for one to finish before starting the other
      log.debug('Running fraud detection and inventory check in parallel...');
      
      const [fraudCheckPassed, inventoryAvailable] = await Promise.all([
        checkFraud(order_id),
        checkInventory(order_id)
      ]);
      
      span.setAttribute('optimization.parallel_checks', true);
      
      // Check fraud detection result
      if (!fraudCheckPassed) {
        await updateOrderStatus(order_id, 'fraud_review');
        span.setAttribute('order.result', 'fraud_review');
        return res.status(200).json({
          order_id: order_id,
          status: 'fraud_review',
          message: 'Order flagged for fraud review',
        });
      }
      
      // Check inventory availability
      if (!inventoryAvailable) {
        await updateOrderStatus(order_id, 'out_of_stock');
        span.setAttribute('order.result', 'out_of_stock');
        return res.status(200).json({
          order_id: order_id,
          status: 'out_of_stock',
          message: 'One or more items are out of stock',
        });
      }
      
      // Step 3: Process payment (now much faster)
      log.debug('Processing payment...');
      try {
        await processPayment(order_id, order.total);
      } catch (paymentError) {
        await updateOrderStatus(order_id, 'payment_failed');
        span.setAttribute('order.result', 'payment_failed');
        return res.status(200).json({
          order_id: order_id,
          status: 'payment_failed',
          message: 'Payment processing failed',
          error: paymentError.message,
        });
      }
      
      // Step 4: Mark as completed
      await updateOrderStatus(order_id, 'completed');
      span.setAttribute('order.result', 'completed');
      
      log.info(`Order ${order_id} completed successfully`);
      
      res.status(200).json({
        order_id: order_id,
        status: 'completed',
        message: 'Order processed successfully',
      });
      
    } catch (error) {
      log.error(`Error processing order ${order_id}:`, error);
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
      
      try {
        await updateOrderStatus(order_id, 'error');
      } catch (updateError) {
        log.error('Failed to update order status:', updateError);
      }
      
      res.status(500).json({
        error: 'Failed to process order',
        message: error.message,
      });
    } finally {
      span.end();
    }
  });
});

// Get order status
app.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Try cache first
    const cachedStatus = await redisClient.get(`order:${orderId}:status`);
    if (cachedStatus) {
      return res.json({
        order_id: orderId,
        status: cachedStatus,
        source: 'cache',
      });
    }
    
    // Query database
    const result = await pgPool.query(
      'SELECT status FROM orders WHERE id = $1',
      [orderId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({
      order_id: orderId,
      status: result.rows[0].status,
      source: 'database',
    });
    
  } catch (error) {
    log.error('Error fetching order status:', error);
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
  try {
    await initializeDatabases();
    
    app.listen(PORT, '0.0.0.0', () => {
      log.info('ShopNow Order Service started');
      log.info(`Server running on port ${PORT}`);
      log.info(`Health check: http://localhost:${PORT}/health`);
      log.info('OpenTelemetry: Enabled');
    });

  } catch (error) {
    log.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  log.info('SIGTERM received, shutting down gracefully...');
  
  if (redisClient) await redisClient.quit();
  if (pgPool) await pgPool.end();
  
  process.exit(0);
});

// Start the server
startServer();

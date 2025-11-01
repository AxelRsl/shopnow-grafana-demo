// ShopNow API Gateway
// Main entry point for the API Gateway service

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { createClient } = require('redis');
const axios = require('axios');
const { SeverityNumber } = require('@opentelemetry/api-logs');

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use(cors());
app.use(express.json());

// Database connections
let pgPool;
let redisClient;

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
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const cacheKey = 'products:all';
    
    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      log.debug('Cache hit for products');
      return res.json({
        source: 'cache',
        data: JSON.parse(cached),
      });
    }

    // Query database
    log.debug('Cache miss, querying database');
    const result = await pgPool.query(
      'SELECT id, sku, name, price, stock, category FROM products WHERE is_active = true LIMIT 20'
    );

    const products = result.rows;

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(products));

    res.json({
      source: 'database',
      data: products,
    });

  } catch (error) {
    log.error('Error fetching products:', error);
    res.status(500).json({
      error: 'Failed to fetch products',
      message: error.message,
    });
  }
});

// Get product by SKU
app.get('/api/products/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const cacheKey = `product:${sku}`;

    // Try cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({
        source: 'cache',
        data: JSON.parse(cached),
      });
    }

    // Query database
    const result = await pgPool.query(
      'SELECT * FROM products WHERE sku = $1 AND is_active = true',
      [sku]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = result.rows[0];
    await redisClient.setEx(cacheKey, 300, JSON.stringify(product));

    res.json({
      source: 'database',
      data: product,
    });

  } catch (error) {
    log.error('Error fetching product:', error);
    res.status(500).json({
      error: 'Failed to fetch product',
      message: error.message,
    });
  }
});

// Create order (calls order service)
app.post('/api/orders', async (req, res) => {
  try {
    const { user_id, items } = req.body;

    // Validate input
    if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'user_id and items array are required',
      });
    }

    // Calculate total
    let total = 0;
    for (const item of items) {
      const product = await pgPool.query(
        'SELECT price FROM products WHERE id = $1',
        [item.product_id]
      );
      
      if (product.rows.length === 0) {
        return res.status(404).json({
          error: 'Product not found',
          product_id: item.product_id,
        });
      }

      total += product.rows[0].price * item.quantity;
    }

    // Create order in database
    const orderResult = await pgPool.query(
      'INSERT INTO orders (user_id, total, subtotal, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, total, total, 'pending']
    );

    const order = orderResult.rows[0];

    // Insert order items
    for (const item of items) {
      const product = await pgPool.query(
        'SELECT price FROM products WHERE id = $1',
        [item.product_id]
      );

      await pgPool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.id, item.product_id, item.quantity, product.rows[0].price]
      );
    }

    // Call order service for processing (if it exists)
    try {
      if (process.env.ORDER_SERVICE_URL) {
        await axios.post(
          `${process.env.ORDER_SERVICE_URL}/process`,
          { order_id: order.id },
          { timeout: 5000 }
        );
        log.info(`Order ${order.id} sent to order service for processing`);
      }
    } catch (serviceError) {
      log.warn('Order service not available, order created but not processed:', serviceError.message);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: order,
    });

  } catch (error) {
    log.error('Error creating order:', error);
    res.status(500).json({
      error: 'Failed to create order',
      message: error.message,
    });
  }
});

// Get orders
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pgPool.query(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT 50'
    );

    res.json({
      data: result.rows,
    });

  } catch (error) {
    log.error('Error fetching orders:', error);
    res.status(500).json({
      error: 'Failed to fetch orders',
      message: error.message,
    });
  }
});

// Simulate Black Friday load
app.post('/api/simulate/traffic', async (req, res) => {
  const { requests = 100, delayMs = 50 } = req.body;
  
  log.info(`Simulating ${requests} requests with ${delayMs}ms delay`);
  
  res.json({
    message: 'Traffic simulation started',
    requests: requests,
    delay: delayMs,
  });

  // Simulate in background
  (async () => {
    for (let i = 0; i < requests; i++) {
      try {
        await pgPool.query('SELECT COUNT(*) FROM products');
        await redisClient.get('simulate:key');
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } catch (error) {
        log.error('Error in simulation:', error.message);
      }
    }
    log.info(`Traffic simulation completed (${requests} requests)`);
  })();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  log.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
  try {
    await initializeDatabases();
    
    app.listen(PORT, '0.0.0.0', () => {
      log.info('ShopNow API Gateway started');
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

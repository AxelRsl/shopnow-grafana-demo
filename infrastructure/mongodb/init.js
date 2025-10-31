// ShopNow MongoDB Initialization Script

db = db.getSiblingDB('shopnow');

// ====================================
// PRODUCT CATALOG COLLECTION
// ====================================
db.product_catalog.drop();
db.product_catalog.insertMany([
  {
    sku: 'LAPTOP-001',
    name: 'MacBook Pro 16"',
    slug: 'macbook-pro-16',
    category: 'Computers',
    subcategory: 'Laptops',
    brand: 'Apple',
    tags: ['laptop', 'apple', 'professional', 'high-performance'],
    images: [
      '/images/macbook-pro-16-1.jpg',
      '/images/macbook-pro-16-2.jpg',
      '/images/macbook-pro-16-3.jpg'
    ],
    specifications: {
      processor: 'Apple M3 Max',
      ram: '32GB',
      storage: '1TB SSD',
      display: '16.2-inch Liquid Retina XDR',
      battery: 'Up to 22 hours',
      weight: '4.7 lbs'
    },
    reviews: [],
    rating: 4.8,
    reviewCount: 0,
    metadata: {
      warranty: '1 year',
      returnPolicy: '30 days',
      shippingWeight: '5.5 lbs',
      dimensions: '14.01 x 9.77 x 0.66 inches'
    },
    seo: {
      metaTitle: 'MacBook Pro 16" - Professional Laptop',
      metaDescription: 'High-performance laptop for professionals',
      keywords: ['macbook', 'pro', 'laptop', 'apple']
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    sku: 'PHONE-001',
    name: 'iPhone 15 Pro',
    slug: 'iphone-15-pro',
    category: 'Phones',
    subcategory: 'Smartphones',
    brand: 'Apple',
    tags: ['phone', 'apple', 'smartphone', 'titanium'],
    images: [
      '/images/iphone-15-pro-1.jpg',
      '/images/iphone-15-pro-2.jpg'
    ],
    specifications: {
      processor: 'A17 Pro chip',
      storage: '256GB',
      display: '6.1-inch Super Retina XDR',
      camera: 'Pro camera system',
      battery: 'Up to 23 hours video playback'
    },
    reviews: [],
    rating: 4.7,
    reviewCount: 0,
    metadata: {
      warranty: '1 year',
      returnPolicy: '14 days',
      shippingWeight: '0.5 lbs',
      dimensions: '5.77 x 2.78 x 0.32 inches'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    sku: 'HEADPHONE-002',
    name: 'Sony WH-1000XM5',
    slug: 'sony-wh-1000xm5',
    category: 'Audio',
    subcategory: 'Headphones',
    brand: 'Sony',
    tags: ['headphones', 'wireless', 'noise-canceling', 'sony'],
    images: [
      '/images/sony-wh1000xm5-1.jpg'
    ],
    specifications: {
      type: 'Over-ear',
      connectivity: 'Bluetooth 5.2',
      battery: '30 hours',
      noiseCancellation: 'Industry-leading ANC',
      weight: '250g'
    },
    reviews: [],
    rating: 4.9,
    reviewCount: 0,
    metadata: {
      warranty: '1 year',
      returnPolicy: '30 days',
      shippingWeight: '1 lb'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// ====================================
// USER SESSIONS COLLECTION
// ====================================
db.sessions.drop();
db.sessions.createIndex({ "userId": 1 });
db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });
db.sessions.createIndex({ "sessionToken": 1 }, { unique: true });

// ====================================
// SHOPPING CARTS COLLECTION
// ====================================
db.carts.drop();
db.carts.createIndex({ "userId": 1 });
db.carts.createIndex({ "sessionId": 1 });
db.carts.createIndex({ "updatedAt": 1 });

// Sample cart
db.carts.insertOne({
  userId: 1,
  sessionId: 'session_123',
  items: [
    {
      productId: 1,
      sku: 'LAPTOP-001',
      name: 'MacBook Pro 16"',
      quantity: 1,
      price: 2499.99,
      addedAt: new Date()
    }
  ],
  total: 2499.99,
  createdAt: new Date(),
  updatedAt: new Date()
});

// ====================================
// ANALYTICS EVENTS COLLECTION
// ====================================
db.events.drop();
db.events.createIndex({ "eventType": 1, "timestamp": -1 });
db.events.createIndex({ "userId": 1, "timestamp": -1 });
db.events.createIndex({ "sessionId": 1 });
db.events.createIndex({ "timestamp": -1 });

// Sample events
db.events.insertMany([
  {
    eventType: 'page_view',
    userId: 1,
    sessionId: 'session_123',
    page: '/products/macbook-pro-16',
    timestamp: new Date(),
    metadata: {
      userAgent: 'Mozilla/5.0...',
      ip: '192.168.1.1',
      referrer: '/category/laptops'
    }
  },
  {
    eventType: 'add_to_cart',
    userId: 1,
    sessionId: 'session_123',
    productId: 1,
    sku: 'LAPTOP-001',
    quantity: 1,
    timestamp: new Date()
  }
]);

// ====================================
// RECOMMENDATIONS COLLECTION
// ====================================
db.recommendations.drop();
db.recommendations.createIndex({ "userId": 1 });
db.recommendations.createIndex({ "productId": 1 });
db.recommendations.createIndex({ "type": 1 });

db.recommendations.insertMany([
  {
    userId: 1,
    productId: 1,
    recommendedProducts: [2, 14, 15],
    type: 'similar_products',
    score: 0.95,
    generatedAt: new Date()
  },
  {
    userId: 1,
    productId: 1,
    recommendedProducts: [11, 12, 18],
    type: 'frequently_bought_together',
    score: 0.88,
    generatedAt: new Date()
  }
]);

// ====================================
// PRODUCT REVIEWS COLLECTION
// ====================================
db.reviews.drop();
db.reviews.createIndex({ "productId": 1 });
db.reviews.createIndex({ "userId": 1 });
db.reviews.createIndex({ "rating": 1 });
db.reviews.createIndex({ "createdAt": -1 });

db.reviews.insertMany([
  {
    productId: 1,
    userId: 2,
    rating: 5,
    title: 'Amazing laptop!',
    content: 'Best laptop I\'ve ever owned. The performance is incredible.',
    verified: true,
    helpful: 12,
    notHelpful: 1,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    productId: 1,
    userId: 3,
    rating: 4,
    title: 'Great but expensive',
    content: 'Excellent build quality and performance, but the price is steep.',
    verified: true,
    helpful: 8,
    notHelpful: 2,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }
]);

// ====================================
// WISHLISTS COLLECTION
// ====================================
db.wishlists.drop();
db.wishlists.createIndex({ "userId": 1 }, { unique: true });

db.wishlists.insertOne({
  userId: 1,
  items: [
    {
      productId: 4,
      sku: 'PHONE-001',
      addedAt: new Date()
    },
    {
      productId: 7,
      sku: 'TABLET-001',
      addedAt: new Date()
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

// Success message
print('✅ MongoDB initialized successfully!');
print('Collections created:');
print('  - product_catalog: ' + db.product_catalog.countDocuments());
print('  - sessions: ' + db.sessions.countDocuments());
print('  - carts: ' + db.carts.countDocuments());
print('  - events: ' + db.events.countDocuments());
print('  - recommendations: ' + db.recommendations.countDocuments());
print('  - reviews: ' + db.reviews.countDocuments());
print('  - wishlists: ' + db.wishlists.countDocuments());

-- ShopNow E-Commerce Database Schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- USERS TABLE
-- ====================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uuid ON users(uuid);

-- ====================================
-- PRODUCTS TABLE
-- ====================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_stock ON products(stock);

-- ====================================
-- ORDERS TABLE
-- ====================================
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    total DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    shipping DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_uuid ON orders(uuid);

-- ====================================
-- ORDER ITEMS TABLE
-- ====================================
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ====================================
-- PAYMENTS TABLE
-- ====================================
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    order_id INTEGER REFERENCES orders(id),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_uuid ON payments(uuid);

-- ====================================
-- INVENTORY TRANSACTIONS TABLE
-- ====================================
CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    reference_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inventory_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_transactions_created_at ON inventory_transactions(created_at);

-- ====================================
-- SEED DATA
-- ====================================

-- Insert test users
INSERT INTO users (email, name, password_hash) VALUES
    ('john.doe@example.com', 'John Doe', 'hashed_password_1'),
    ('jane.smith@example.com', 'Jane Smith', 'hashed_password_2'),
    ('bob.johnson@example.com', 'Bob Johnson', 'hashed_password_3'),
    ('alice.williams@example.com', 'Alice Williams', 'hashed_password_4'),
    ('charlie.brown@example.com', 'Charlie Brown', 'hashed_password_5');

-- Insert products (Black Friday inventory)
INSERT INTO products (sku, name, description, price, stock, category) VALUES
    ('LAPTOP-001', 'MacBook Pro 16"', 'High-performance laptop for professionals', 2499.99, 50, 'Computers'),
    ('LAPTOP-002', 'Dell XPS 15', 'Premium Windows laptop', 1899.99, 75, 'Computers'),
    ('LAPTOP-003', 'ThinkPad X1 Carbon', 'Business ultrabook', 1699.99, 60, 'Computers'),
    
    ('PHONE-001', 'iPhone 15 Pro', 'Latest iPhone with titanium design', 1199.99, 200, 'Phones'),
    ('PHONE-002', 'Samsung Galaxy S24', 'Flagship Android phone', 999.99, 180, 'Phones'),
    ('PHONE-003', 'Google Pixel 8 Pro', 'AI-powered photography', 899.99, 150, 'Phones'),
    
    ('TABLET-001', 'iPad Pro 12.9"', 'Professional tablet with M2 chip', 1099.99, 100, 'Tablets'),
    ('TABLET-002', 'Samsung Tab S9', 'Android flagship tablet', 899.99, 120, 'Tablets'),
    
    ('WATCH-001', 'Apple Watch Ultra 2', 'Premium smartwatch', 799.99, 80, 'Wearables'),
    ('WATCH-002', 'Samsung Galaxy Watch 6', 'Android smartwatch', 399.99, 150, 'Wearables'),
    
    ('HEADPHONE-001', 'AirPods Pro', 'Premium wireless earbuds', 249.99, 300, 'Audio'),
    ('HEADPHONE-002', 'Sony WH-1000XM5', 'Noise-canceling headphones', 399.99, 200, 'Audio'),
    ('HEADPHONE-003', 'Bose QC45', 'Premium noise cancellation', 329.99, 180, 'Audio'),
    
    ('MOUSE-001', 'Logitech MX Master 3S', 'Ergonomic wireless mouse', 99.99, 400, 'Accessories'),
    ('KEYBOARD-001', 'Keychron K2', 'Mechanical wireless keyboard', 89.99, 300, 'Accessories'),
    ('MONITOR-001', 'LG 27" 4K', '4K UHD monitor', 449.99, 90, 'Monitors'),
    ('MONITOR-002', 'Dell UltraSharp 32"', 'Professional 4K monitor', 699.99, 60, 'Monitors'),
    
    ('CHARGER-001', 'Anker 65W GaN', 'Fast USB-C charger', 49.99, 500, 'Accessories'),
    ('CABLE-001', 'USB-C Cable 6ft', 'Braided fast charging cable', 19.99, 1000, 'Accessories'),
    ('HUB-001', 'USB-C Hub 7-in-1', 'Multiport adapter', 79.99, 250, 'Accessories');

-- Insert some sample orders
INSERT INTO orders (user_id, total, subtotal, tax, shipping, status, shipping_address) VALUES
    (1, 2749.98, 2549.98, 199.99, 0.00, 'completed', '123 Main St, New York, NY 10001'),
    (2, 1999.98, 1899.99, 99.99, 0.00, 'completed', '456 Oak Ave, Los Angeles, CA 90001'),
    (3, 899.99, 849.99, 50.00, 0.00, 'processing', '789 Pine Rd, Chicago, IL 60601');

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
    (1, 1, 1, 2499.99),
    (1, 14, 1, 99.99),
    (2, 2, 1, 1899.99),
    (3, 6, 1, 899.99);

-- Insert payments
INSERT INTO payments (order_id, amount, status, payment_method, transaction_id) VALUES
    (1, 2749.98, 'completed', 'credit_card', 'txn_' || uuid_generate_v4()),
    (2, 1999.98, 'completed', 'credit_card', 'txn_' || uuid_generate_v4()),
    (3, 899.99, 'pending', 'credit_card', 'txn_' || uuid_generate_v4());

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO shopnow;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO shopnow;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'ShopNow database initialized successfully!';
    RAISE NOTICE 'Products loaded: %', (SELECT COUNT(*) FROM products);
    RAISE NOTICE 'Users created: %', (SELECT COUNT(*) FROM users);
END $$;

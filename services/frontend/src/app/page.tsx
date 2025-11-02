'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { trackEvent, trackError } from '@/lib/faro';

interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      trackEvent('page_view', { page: 'products' });
      setLoading(true);
      setError(null);

      const data = await api.getProducts();
      setProducts(data.data || []);

      trackEvent('products_loaded', {
        count: data.data?.length || 0,
        source: data.source,
      });
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      trackError(err as Error, { page: 'products' });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));

    trackEvent('add_to_cart', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: (cart[product.id] || 0) + 1,
    });

    // Show feedback
    alert(`✅ ${product.name} added to cart!`);
  };

  const checkout = async () => {
    const items = Object.entries(cart).map(([productId, quantity]) => ({
      product_id: parseInt(productId),
      quantity,
    }));

    if (items.length === 0) {
      alert('❌ Cart is empty!');
      return;
    }

    try {
      trackEvent('checkout_button_clicked', {
        itemCount: items.length,
        totalItems: Object.values(cart).reduce((a, b) => a + b, 0),
      });

      const result = await api.createOrder({
        user_id: 1, // Demo user
        items,
      });

      alert(`✅ Order created successfully! Order ID: ${result.order?.id}`);
      setCart({});

      trackEvent('order_success', {
        orderId: result.order?.id,
        total: result.order?.total,
      });
    } catch (err) {
      alert(`❌ Order failed: ${(err as Error).message}`);
      trackError(err as Error, { page: 'checkout' });
    }
  };

  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
        <button
          onClick={loadProducts}
          className="ml-4 bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">🔥 Black Friday Deals</h2>
        <div className="flex gap-4">
          <div className="bg-blue-100 px-4 py-2 rounded">
            Cart: {cartItemCount} items
          </div>
          {cartItemCount > 0 && (
            <button
              onClick={checkout}
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 font-bold"
            >
              🛒 Checkout
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="border rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="h-48 bg-gray-200 rounded mb-4 flex items-center justify-center">
              <span className="text-4xl">📦</span>
            </div>
            <h3 className="font-bold text-lg mb-2">{product.name}</h3>
            <p className="text-gray-600 text-sm mb-2">{product.category}</p>
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl font-bold text-green-600">
                ${product.price}
              </span>
              <span className="text-sm text-gray-500">
                Stock: {product.stock}
              </span>
            </div>
            <button
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              className={`w-full py-2 rounded font-bold ${
                product.stock > 0
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {product.stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
            </button>
            {cart[product.id] && (
              <div className="mt-2 text-center text-sm text-green-600">
                ✓ {cart[product.id]} in cart
              </div>
            )}
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          No products available
        </div>
      )}
    </div>
  );
}

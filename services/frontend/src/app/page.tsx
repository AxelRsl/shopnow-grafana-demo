'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { trackEvent, trackError } from '@/lib/faro';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<{ [key: number]: number }>({});

  // Helper function to get product image
  const getProductImage = (product: Product) => {
    // Check for specific products first
    const productName = product.name.toLowerCase();
    
    if (productName.includes('cable')) {
      return 'https://images.unsplash.com/photo-1601524909162-ae8725290836?w=400&h=300&fit=crop'; // USB-C cables
    }
    
    if (productName.includes('hub') || productName.includes('7-in-1')) {
      return 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=300&fit=crop'; // USB-C Hub/Adapter
    }
    
    if (productName.includes('mouse')) {
      return 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop'; // Mouse
    }
    
    if (productName.includes('keyboard')) {
      return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop'; // Keyboard
    }
    
    if (productName.includes('charger') || productName.includes('anker') || productName.includes('gan')) {
      return 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=300&fit=crop'; // Charger/Adapter
    }
    
    // Map product categories to images
    const imageMap: Record<string, string> = {
      'computers': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop',
      'phones': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
      'tablets': 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&h=300&fit=crop',
      'wearables': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
      'audio': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
      'monitors': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop',
      'accessories': 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400&h=300&fit=crop',
    };

    return product.image || imageMap[product.category.toLowerCase()] || 
           'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop';
  };

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
            className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
          >
            {/* Product Image */}
            <div className="relative h-48 bg-gray-100">
              <img
                src={getProductImage(product)}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute top-2 right-2">
                <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                  {product.category}
                </span>
              </div>
            </div>

            {/* Product Details */}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2 line-clamp-2">{product.name}</h3>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-green-600">
                  ${product.price}
                </span>
                <span className={`text-sm font-medium ${product.stock > 10 ? 'text-green-600' : 'text-orange-600'}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              <button
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                className={`w-full py-2 rounded font-bold transition-colors ${
                  product.stock > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {product.stock > 0 ? '🛒 Add to Cart' : 'Out of Stock'}
              </button>
              
              {cart[product.id] && (
                <div className="mt-2 text-center text-sm text-green-600 font-semibold">
                  ✓ {cart[product.id]} in cart
                </div>
              )}
            </div>
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

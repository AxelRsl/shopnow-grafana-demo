'use client';

import { useEffect } from 'react';
import { initFaro } from '@/lib/faro';
import './globals.css';

// Extend Window interface for Faro
declare global {
  interface Window {
    faro?: any;
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    console.log('🔧 RootLayout: useEffect ejecutándose...');
    
    // Initialize Faro on mount (client-side only)
    const faro = initFaro();
    
    if (faro) {
      console.log('✅ Faro está funcionando!');
      console.log('✅ window.faro está disponible (establecido automáticamente por initializeFaro)');
    } else {
      console.error('❌ Faro NO se inicializó');
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <title>ShopNow - Black Friday Deals</title>
        <meta name="description" content="Amazing Black Friday deals on electronics" />
      </head>
      <body>
        <nav className="bg-blue-600 text-white p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">🛒 ShopNow</h1>
            <div className="flex gap-4">
              <a href="/" className="hover:underline">Products</a>
              <a href="/cart" className="hover:underline">Cart</a>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-4">
          {children}
        </main>
        <footer className="bg-gray-800 text-white p-4 mt-8">
          <div className="container mx-auto text-center">
            <p>© 2024 ShopNow - Monitored with Grafana Faro 📊</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

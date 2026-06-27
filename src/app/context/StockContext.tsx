import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { products } from '../data/products';

interface SizeStock {
  size: string;
  quantity: number;
}

interface StockContextType {
  stock: Record<string, number>;
  sizeStock: Record<string, SizeStock[]>;
  loading: boolean;
  getStock: (productId: string) => number;
  getStockForSize: (productId: string, size: string) => number;
  refreshStock: () => Promise<void>;
}

export const StockContext = createContext<StockContextType | undefined>(undefined);

const buildFallbackStock = (): { stock: Record<string, number>; sizeStock: Record<string, SizeStock[]> } => {
  const stock: Record<string, number> = {};
  const sizeStock: Record<string, SizeStock[]> = {};

  products.forEach(p => {
    // Total stock — use sizeStock sum if available, otherwise p.stock
    if (p.sizeStock && p.sizeStock.length > 0) {
      stock[p.id] = p.sizeStock.reduce((sum, s) => sum + s.quantity, 0);
      sizeStock[p.id] = p.sizeStock.map(s => ({ size: s.size, quantity: s.quantity }));
    } else if (p.stock !== undefined) {
      stock[p.id] = p.stock;
      // Distribute evenly across sizes if no per-size data
      if (p.sizes.length > 0) {
        const perSize = Math.floor(p.stock / p.sizes.length);
        sizeStock[p.id] = p.sizes.map(s => ({ size: s, quantity: perSize }));
      }
    }
  });

  return { stock, sizeStock };
};

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stock, setStock] = useState<Record<string, number>>({});
  const [sizeStock, setSizeStock] = useState<Record<string, SizeStock[]>>({});
  const [loading, setLoading] = useState(true);

  const applyFallback = () => {
    const { stock: s, sizeStock: ss } = buildFallbackStock();
    setStock(s);
    setSizeStock(ss);
  };

  const fetchStock = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/stock`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );

      if (!response.ok) {
        console.warn('Stock fetch failed:', response.status);
        applyFallback();
        return;
      }

      const data = await response.json();
      if (data.success && data.stock) {
        setStock(data.stock);
        // If backend returns per-size stock use it, otherwise derive from products
        if (data.sizeStock) {
          setSizeStock(data.sizeStock);
        } else {
          const { sizeStock: ss } = buildFallbackStock();
          setSizeStock(ss);
        }
      } else {
        applyFallback();
      }
    } catch (error) {
      console.warn('Error fetching stock, using fallback:', error);
      applyFallback();
    } finally {
      setLoading(false);
    }
  };

  const syncStock = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/stock/sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ products }),
        }
      );

      if (!response.ok) {
        console.warn('Stock sync failed:', response.status);
        await fetchStock();
        return;
      }

      const data = await response.json();
      console.log('Stock synced:', data.message || 'Done');
      await fetchStock();
    } catch (error) {
      console.warn('Error syncing stock:', error);
      await fetchStock();
    }
  };

  const refreshStock = async () => {
    await fetchStock();
  };

  // Total stock for a product
  const getStock = (productId: string): number => {
    if (stock[productId] !== undefined) return stock[productId];
    const product = products.find(p => p.id === productId);
    if (product?.sizeStock) return product.sizeStock.reduce((sum, s) => sum + s.quantity, 0);
    return product?.stock ?? 0;
  };

  // Stock for a specific size
  const getStockForSize = (productId: string, size: string): number => {
    // 1. Check in-memory sizeStock (from server or derived)
    const perSize = sizeStock[productId];
    if (perSize) {
      const entry = perSize.find(s => s.size === size);
      if (entry !== undefined) return entry.quantity;
    }

    // 2. Fallback to product definition
    const product = products.find(p => p.id === productId);
    if (product?.sizeStock) {
      const entry = product.sizeStock.find(s => s.size === size);
      if (entry) return entry.quantity;
    }

    // 3. Last resort: distribute total evenly
    if (product?.stock && product.sizes.length > 0) {
      return Math.floor(product.stock / product.sizes.length);
    }
    return 0;
  };

  useEffect(() => {
    const init = async () => {
      try {
        await syncStock();
      } catch (error) {
        console.warn('Stock init failed, using fallback:', error);
        applyFallback();
        setLoading(false);
      }
    };
    init();
  }, []);

  return (
    <StockContext.Provider value={{ stock, sizeStock, loading, getStock, getStockForSize, refreshStock }}>
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (context === undefined) throw new Error('useStock must be used within a StockProvider');
  return context;
};

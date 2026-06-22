import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import {
  getAllProducts,
  getTotalStock,
  getSizeStock as getSizeStockHelper,
  decrementStock as decrementStockHelper,
} from '../data/products';

interface StockContextType {
  stock: Record<string, number>;
  loading: boolean;
  getStock: (productId: string) => number;
  getSizeStock: (productId: string, size: string, color?: string) => number;
  refreshStock: () => Promise<void>;
  decrementStock: (productId: string, qty: number, size?: string, color?: string) => void;
}

export const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stock, setStock] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  // Bumped whenever stock changes locally (new product added, order placed, admin edit)
  // so getStock/getSizeStock re-read the latest localStorage data.
  const [version, setVersion] = useState(0);

  // Build the stock map from every product currently known (static + admin-added),
  // using the override-aware getTotalStock helper from data/products.ts.
  const buildLocalStock = (): Record<string, number> => {
    const localStock: Record<string, number> = {};
    getAllProducts().forEach((p) => {
      localStock[p.id] = getTotalStock(p);
    });
    return localStock;
  };

  const fetchStock = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/stock`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        console.warn('Stock fetch failed with status:', response.status);
        setStock(buildLocalStock());
        return;
      }

      const data = await response.json();
      if (data.success && data.stock) {
        // Merge server stock with locally tracked (admin-added) products so
        // products that only exist in localStorage still show correct stock.
        setStock({ ...buildLocalStock(), ...data.stock });
      } else {
        setStock(buildLocalStock());
      }
    } catch (error) {
      console.warn('Error fetching stock, using fallback values:', error);
      setStock(buildLocalStock());
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
          body: JSON.stringify({ products: getAllProducts() }),
        }
      );

      if (!response.ok) {
        console.warn('Stock sync failed with status:', response.status);
        await fetchStock();
        return;
      }

      const data = await response.json();
      console.log('Stock synced successfully:', data.message || 'Done');
      await fetchStock();
    } catch (error) {
      console.warn('Error syncing stock, continuing with fallback:', error);
      await fetchStock();
    }
  };

  const refreshStock = async () => {
    await fetchStock();
  };

  // Get total stock for a product (sum of all sizeStock entries, override-aware)
  const getStock = (productId: string): number => {
    const product = getAllProducts().find(p => p.id === productId);
    if (product) {
      return getTotalStock(product);
    }
    if (stock[productId] !== undefined) {
      return stock[productId];
    }
    return 0;
  };

  // Get stock for a specific size (and optionally color), override-aware
  const getSizeStock = (productId: string, size: string, color?: string): number => {
    const product = getAllProducts().find(p => p.id === productId);
    if (!product) return 0;
    return getSizeStockHelper(product, size, color);
  };

  // Reduce stock after an order is placed (called from Checkout). Persists to
  // localStorage immediately and refreshes the in-memory stock map so every
  // page (ProductCard, ProductDetail, Cart, Checkout) reflects it right away.
  const decrementStock = useCallback((productId: string, qty: number, size?: string, color?: string) => {
    decrementStockHelper(productId, qty, size, color);
    setVersion(v => v + 1);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await syncStock();
      } catch (error) {
        console.warn('Stock initialization failed, using fallback values:', error);
        setStock(buildLocalStock());
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever a local stock change happens (new product, decrement after order),
  // refresh the displayed stock map from the latest localStorage state.
  useEffect(() => {
    if (version > 0) {
      setStock(buildLocalStock());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  return (
    <StockContext.Provider value={{ stock, loading, getStock, getSizeStock, refreshStock, decrementStock }}>
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};

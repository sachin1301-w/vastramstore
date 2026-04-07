import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { products } from '../data/products';

interface StockContextType {
  stock: Record<string, number>;
  loading: boolean;
  getStock: (productId: string) => number;
  refreshStock: () => Promise<void>;
}

export const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stock, setStock] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

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
        // Use fallback stock from products.ts
        const fallbackStock: Record<string, number> = {};
        products.forEach(p => {
          if (p.stock !== undefined) {
            fallbackStock[p.id] = p.stock;
          }
        });
        setStock(fallbackStock);
        return;
      }

      const data = await response.json();
      if (data.success && data.stock) {
        setStock(data.stock);
      } else {
        // Use fallback stock from products.ts
        const fallbackStock: Record<string, number> = {};
        products.forEach(p => {
          if (p.stock !== undefined) {
            fallbackStock[p.id] = p.stock;
          }
        });
        setStock(fallbackStock);
      }
    } catch (error) {
      console.warn('Error fetching stock, using fallback values:', error);
      // Use fallback stock from products.ts
      const fallbackStock: Record<string, number> = {};
      products.forEach(p => {
        if (p.stock !== undefined) {
          fallbackStock[p.id] = p.stock;
        }
      });
      setStock(fallbackStock);
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
        console.warn('Stock sync failed with status:', response.status);
        // Still try to fetch existing stock
        await fetchStock();
        return;
      }

      const data = await response.json();
      console.log('Stock synced successfully:', data.message || 'Done');
      await fetchStock();
    } catch (error) {
      console.warn('Error syncing stock, continuing with fallback:', error);
      // Still try to fetch stock or use fallback
      await fetchStock();
    }
  };

  const refreshStock = async () => {
    await fetchStock();
  };

  const getStock = (productId: string): number => {
    // Return the stock from state, or fallback to the product's initial stock value
    if (stock[productId] !== undefined) {
      return stock[productId];
    }

    // Fallback to product's initial stock value
    const product = products.find(p => p.id === productId);
    return product?.stock ?? 0;
  };

  useEffect(() => {
    const init = async () => {
      try {
        // Try to sync stock from products.ts to backend
        await syncStock();
      } catch (error) {
        console.warn('Stock initialization failed, using fallback values:', error);
        // Use fallback stock from products.ts
        const fallbackStock: Record<string, number> = {};
        products.forEach(p => {
          if (p.stock !== undefined) {
            fallbackStock[p.id] = p.stock;
          }
        });
        setStock(fallbackStock);
        setLoading(false);
      }
    };

    init();
  }, []);

  return (
    <StockContext.Provider value={{ stock, loading, getStock, refreshStock }}>
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

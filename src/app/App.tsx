import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { StockProvider } from './context/StockContext';

export default function App() {
  return (
    <AuthProvider>
      <StockProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </StockProvider>
    </AuthProvider>
  );
}
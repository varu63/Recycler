import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { QueryProvider } from '@/context/query-provider';
import { AppRoutes } from '@/routes';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryProvider>
  </StrictMode>
);

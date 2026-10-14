import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface CartItem {
  id: string;
  title: string;
  category: string;
  pricePerKg: number;
  quantityKg: number;
  image: string;
  location: string;
}

export interface DeliveryAddress {
  fullName: string;
  mobile: string;
  company?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  gst: number;
  transportFee: number;
  totalAmount: number;
  deliveryAddress: DeliveryAddress;
  addToCart: (item: Omit<CartItem, 'quantityKg'>, quantity?: number) => void;
  updateQuantity: (id: string, newQuantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  setDeliveryAddress: (address: Partial<DeliveryAddress>) => void;
}

const DEFAULT_ITEMS: CartItem[] = [
  {
    id: 'mat-copper-01',
    title: 'Copper',
    category: 'Copper',
    pricePerKg: 600,
    quantityKg: 200,
    image: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=400&q=80',
    location: 'Delhi, India',
  },
  {
    id: 'mat-aluminium-02',
    title: 'Aluminium',
    category: 'Aluminium',
    pricePerKg: 220,
    quantityKg: 100,
    image: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=400&q=80',
    location: 'Ahmedabad, India',
  },
  {
    id: 'mat-steel-03',
    title: 'Steel',
    category: 'Steel',
    pricePerKg: 75,
    quantityKg: 150,
    image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80',
    location: 'Mumbai, India',
  },
];

const DEFAULT_ADDRESS: DeliveryAddress = {
  fullName: 'Varun Tomar',
  mobile: '+91 98765 43210',
  company: 'MaxSpace Pvt Ltd',
  address: '123 Green Park, Near Main Road',
  city: 'Delhi',
  state: 'Delhi',
  pincode: '110001',
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('metalmundi_cart');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_ITEMS;
  });

  const [deliveryAddress, setAddress] = useState<DeliveryAddress>(() => {
    try {
      const saved = localStorage.getItem('metalmundi_delivery');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_ADDRESS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('metalmundi_cart', JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('metalmundi_delivery', JSON.stringify(deliveryAddress));
    } catch {
      // ignore
    }
  }, [deliveryAddress]);

  const addToCart = (item: Omit<CartItem, 'quantityKg'>, quantity = 100) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantityKg: i.quantityKg + quantity } : i
        );
      }
      return [...prev, { ...item, quantityKg: quantity }];
    });
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantityKg: Math.max(1, newQuantity) } : i))
    );
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const setDeliveryAddress = (patch: Partial<DeliveryAddress>) => {
    setAddress((prev) => ({ ...prev, ...patch }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.pricePerKg * item.quantityKg, 0);
  const gst = Math.round(subtotal * 0.18);
  const transportFee = items.length > 0 ? 2000 : 0;
  const totalAmount = subtotal + gst + transportFee;
  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        gst,
        transportFee,
        totalAmount,
        deliveryAddress,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        setDeliveryAddress,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

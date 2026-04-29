import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string; // Combined productId_variantId
  productId: string;
  variantId?: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity?: number, variant?: any) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (id: string, quantity: number) => void;
  total: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  updateQuantity: () => {},
  total: 0
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('manufaktur_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('manufaktur_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: any, quantity = 1, variant?: any) => {
    setItems(current => {
      const cartItemId = variant ? `${product.id}_${variant.id}` : product.id;
      const existing = current.find(item => item.id === cartItemId);
      
      if (existing) {
        return current.map(item => 
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      
      const itemPrice = variant?.price ?? product.price;
      const itemTitle = variant ? `${product.title} - ${variant.name}` : product.title;

      return [...current, { 
        id: cartItemId,
        productId: product.id,
        variantId: variant?.id,
        title: itemTitle, 
        price: itemPrice, 
        quantity,
        image: product.images?.[0]
      }];
    });
  };

  const removeFromCart = (id: string) => {
    setItems(current => current.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems(current => current.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

import React, { createContext, useContext } from 'react';
import { useCart, CartItem, CartPromo, DeliveryMethodChoice, CartDeliveryPartner } from '@/hooks/useCart';

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  addToCart: (product: Omit<CartItem, "quantity">) => Promise<void>;
  removeFromCart: (target: Pick<CartItem, 'id' | 'productType'>) => void;
  updateQuantity: (target: Pick<CartItem, 'id' | 'productType'>, newQuantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  appliedPromo: CartPromo | null;
  applyPromo: (promo: CartPromo) => void;
  clearPromo: () => void;
  deliveryMethod: DeliveryMethodChoice;
  deliveryPartner: CartDeliveryPartner | null;
  setDeliveryMethod: (method: DeliveryMethodChoice) => void;
  setDeliveryPartner: (partner: CartDeliveryPartner | null) => void;
  resetDelivery: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cart = useCart();

  return (
    <CartContext.Provider value={cart}>
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};
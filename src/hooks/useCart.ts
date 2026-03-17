import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  inStock: boolean;
}

export type CartPromoType = 'PERCENTAGE' | 'FIXED';

export interface CartPromo {
  code: string;
  discountType: CartPromoType;
  discountValue: number;
  description?: string | null;
}

export type DeliveryMethodChoice = 'PICKUP' | 'DELIVERY';

export interface CartDeliveryPartner {
  id: number;
  name: string;
  baseRate?: number | null;
  estimatedDelay?: string | null;
}

export const computeShippingFee = (
  subtotal: number,
  method: DeliveryMethodChoice,
  partner?: CartDeliveryPartner | null,
) => {
  if (method === 'PICKUP') {
    return 0;
  }
  if (partner?.baseRate != null) {
    const rate = Number(partner.baseRate);
    if (Number.isFinite(rate) && rate >= 0) {
      return rate;
    }
  }
  if (!Number.isFinite(subtotal)) {
    return 0;
  }
  return subtotal > 50000 ? 0 : 5000;
};

interface StoredCart {
  items: CartItem[];
  promo?: CartPromo | null;
  delivery?: {
    method: DeliveryMethodChoice;
    partner?: CartDeliveryPartner | null;
  };
}

const STORAGE_KEY = 'bia-cart';

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<CartPromo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethodState] = useState<DeliveryMethodChoice>('PICKUP');
  const [deliveryPartner, setDeliveryPartnerState] = useState<CartDeliveryPartner | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(STORAGE_KEY);
    if (!savedCart) return;

    try {
      const parsed = JSON.parse(savedCart) as StoredCart | CartItem[];
      if (Array.isArray(parsed)) {
        setItems(parsed);
      } else if (parsed && typeof parsed === 'object') {
        setItems(Array.isArray(parsed.items) ? parsed.items : []);
        setAppliedPromo(parsed.promo ?? null);
        if (parsed.delivery && typeof parsed.delivery === 'object') {
          const method = parsed.delivery.method;
          if (method === 'DELIVERY' || method === 'PICKUP') {
            setDeliveryMethodState(method);
          }
          setDeliveryPartnerState(parsed.delivery.partner ?? null);
        }
      }
    } catch (error) {
      console.warn('[cart] Unable to parse stored cart:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save cart to localStorage whenever items or promo change
  useEffect(() => {
    const payload: StoredCart = {
      items,
      promo: appliedPromo,
      delivery: {
        method: deliveryMethod,
        partner: deliveryPartner,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [items, appliedPromo, deliveryMethod, deliveryPartner]);

  const addToCart = async (product: Omit<CartItem, "quantity">) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);
      
      if (existingItem) {
        toast({
          title: "Quantité mise à jour",
          description: `${product.name} quantité augmentée dans le panier`,
        });
        return currentItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        toast({
          title: "Produit ajouté",
          description: `${product.name} ajouté au panier`,
        });
        return [...currentItems, { ...product, quantity: 1 }];
      }
    });
    setIsLoading(false);
  };

  const removeFromCart = (productId: string) => {
    setItems(currentItems => {
      const item = currentItems.find(item => item.id === productId);
      if (item) {
        toast({
          title: "Produit retiré",
          description: `${item.name} retiré du panier`,
        });
      }
      const updated = currentItems.filter(item => item.id !== productId);
      if (updated.length === 0) {
        setAppliedPromo(null);
        setDeliveryMethodState('PICKUP');
        setDeliveryPartnerState(null);
      }
      return updated;
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedPromo(null);
    setDeliveryMethodState('PICKUP');
    setDeliveryPartnerState(null);
    toast({
      title: "Panier vidé",
      description: "Tous les articles ont été retirés du panier",
    });
  };

  const getCartTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const applyPromo = useCallback((promo: CartPromo) => {
    setAppliedPromo(promo);
  }, []);

  const clearPromo = useCallback(() => {
    setAppliedPromo(null);
  }, []);

  const setDeliveryMethod = useCallback((method: DeliveryMethodChoice) => {
    setDeliveryMethodState(method);
    if (method === 'PICKUP') {
      setDeliveryPartnerState(null);
    }
  }, []);

  const setDeliveryPartner = useCallback((partner: CartDeliveryPartner | null) => {
    setDeliveryPartnerState(partner);
    if (!partner) {
      setDeliveryMethodState('PICKUP');
    } else {
      setDeliveryMethodState('DELIVERY');
    }
  }, []);

  const resetDelivery = useCallback(() => {
    setDeliveryMethodState('PICKUP');
    setDeliveryPartnerState(null);
  }, []);

  return {
    items,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    appliedPromo,
    applyPromo,
    clearPromo,
    deliveryMethod,
    deliveryPartner,
    setDeliveryMethod,
    setDeliveryPartner,
    resetDelivery,
  };
};
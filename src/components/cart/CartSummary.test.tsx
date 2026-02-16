import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CartSummary } from './CartSummary';

type MockCartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type MockPromo = {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  description?: string | null;
};

type MockDeliveryPartner = {
  name: string;
  baseRate?: number | null;
  estimatedDelay?: string;
} | null;

type MockCartContext = {
  items: MockCartItem[];
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  appliedPromo: MockPromo | null;
  applyPromo: (promo: MockPromo) => void;
  clearPromo: () => void;
  deliveryMethod: 'PICKUP' | 'DELIVERY';
  deliveryPartner: MockDeliveryPartner;
};

let mockCartContext: MockCartContext;

vi.mock('@/context/CartContext', () => ({
  useCartContext: () => mockCartContext,
}));

vi.mock('@/hooks/useCart', () => ({
  computeShippingFee: vi.fn().mockReturnValue(1500),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: () => undefined,
    toasts: [],
  }),
}));

function renderWithRouter() {
  return render(
    <BrowserRouter>
      <CartSummary />
    </BrowserRouter>,
  );
}

describe('CartSummary', () => {
  beforeEach(() => {
    mockCartContext = {
      items: [],
      getCartTotal: () => 0,
      getCartItemsCount: () => 0,
      appliedPromo: null,
      applyPromo: () => undefined,
      clearPromo: () => undefined,
      deliveryMethod: 'PICKUP',
      deliveryPartner: null,
    };
  });

  it('ne rend rien lorsque le panier est vide', () => {
    mockCartContext.items = [];
    mockCartContext.getCartTotal = () => 0;
    renderWithRouter();
    expect(screen.queryByText(/résumé de commande/i)).toBeNull();
  });

  it('affiche le résumé avec montant total lorsque le panier contient des articles', () => {
    mockCartContext.items = [
      { id: '1', name: 'Tomates', price: 2000, quantity: 1 },
      { id: '2', name: 'Oignons', price: 1000, quantity: 1 },
    ];
    mockCartContext.getCartTotal = () => 3000;
    mockCartContext.getCartItemsCount = () => 2;
    renderWithRouter();

    expect(screen.getByText(/résumé de commande/i)).toBeDefined();
    expect(screen.getByText(/2 articles?/i)).toBeDefined();
    expect(screen.getByText(/3 000 FCFA|3 000 FCFA/)).toBeDefined();
    expect(screen.getByText(/procéder au paiement/i)).toBeDefined();
  });
});


import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Checkout from './Checkout';

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
} | null;

type MockCartContext = {
  items: MockCartItem[];
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  clearCart: () => void;
  appliedPromo: MockPromo;
  clearPromo: () => void;
  applyPromo: (promo: Exclude<MockPromo, null>) => void;
};

let mockCartContext: MockCartContext;
const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/context/CartContext', () => ({
  useCartContext: () => mockCartContext,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
    toasts: [],
  }),
}));

vi.mock('@/i18n/i18n', () => ({
  useI18n: () => ({
    lang: 'fr',
    setLang: () => undefined,
    t: (key: string) => key,
    available: [],
  }),
}));

vi.mock('@/integrations/api/client', () => ({
  api: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: '1' } } } }),
    },
    promoCodes: {
      validate: vi.fn().mockResolvedValue({
        data: {
          code: 'PROMO10',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          discountAmount: 1000,
          description: '10% de réduction',
        },
      }),
    },
  },
}));

function renderWithRouter() {
  return render(
    <BrowserRouter>
      <Checkout />
    </BrowserRouter>,
  );
}

describe('Checkout page', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockCartContext = {
      items: [
        { id: '1', name: 'Tomates', price: 2000, quantity: 1 },
        { id: '2', name: 'Oignons', price: 1000, quantity: 1 },
      ],
      getCartTotal: () => 3000,
       getCartItemsCount: () => 2,
      clearCart: () => undefined,
      appliedPromo: null,
      clearPromo: () => undefined,
      applyPromo: () => undefined,
    };
  });

  it('affiche un message d’erreur quand les informations de livraison sont manquantes', async () => {
    const { container } = renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/finaliser la commande/i)).toBeDefined();
    });

    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalled();
    });
  });
});

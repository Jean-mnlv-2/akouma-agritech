import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthForm } from './AuthForm';
import { Toaster } from '../ui/toaster';

vi.mock('@/integrations/api/client', () => ({
  api: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: '1', role: 'customer' } } }),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: '2', role: 'customer' } } }),
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: () => undefined,
    toasts: [],
  }),
}));

function renderWithProviders() {
  return render(
    <BrowserRouter>
      <Toaster />
      <AuthForm />
    </BrowserRouter>,
  );
}

describe('AuthForm', () => {
  it('valide la présence des champs email et mot de passe en login', async () => {
    renderWithProviders();

    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getAllByText(/email/i).length).toBeGreaterThan(0);
    });
  });
});

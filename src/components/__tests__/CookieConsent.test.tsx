import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

const requestMock = vi.fn().mockResolvedValue({});
vi.mock('@/integrations/api/client', () => ({
  api: { request: (...a: unknown[]) => requestMock(...a) },
}));

import CookieConsent from '@/components/CookieConsent';
import { OPEN_PREFERENCES_EVENT, readConsent } from '@/lib/cookieConsent';

function renderBanner() {
  return render(
    <BrowserRouter>
      <CookieConsent />
    </BrowserRouter>,
  );
}

describe('CookieConsent banner (E2E-style)', () => {
  beforeEach(() => {
    localStorage.clear();
    requestMock.mockClear();
    vi.useFakeTimers();
  });

  it('shows the banner on first visit and hides it after "Tout accepter"', async () => {
    renderBanner();
    act(() => { vi.advanceTimersByTime(1000); });
    const accept = await screen.findByRole('button', { name: /tout accepter/i });
    expect(accept).toBeInTheDocument();

    vi.useRealTimers();
    fireEvent.click(accept);

    await waitFor(() => {
      expect(readConsent()?.method).toBe('accept_all');
    });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /tout accepter/i })).not.toBeInTheDocument();
    });
    expect(requestMock).toHaveBeenCalledWith('POST', '/api/cookie-consents', expect.any(Object));
  });

  it('does not display the banner when a valid consent already exists', async () => {
    localStorage.setItem(
      'kilimo_cookie_consent',
      JSON.stringify({
        version: '1.0.0',
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        method: 'reject_all',
        timestamp: new Date().toISOString(),
        anonId: 'anon-test',
      }),
    );
    renderBanner();
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.queryByRole('button', { name: /tout accepter/i })).not.toBeInTheDocument();
  });

  it('opens preferences via the global event, lets user customize, and persists their choice', async () => {
    // Pre-existing consent so the banner stays closed and we drive only the modal
    localStorage.setItem(
      'kilimo_cookie_consent',
      JSON.stringify({
        version: '1.0.0',
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
        method: 'reject_all',
        timestamp: new Date().toISOString(),
        anonId: 'anon-test',
      }),
    );
    renderBanner();
    vi.useRealTimers();

    act(() => { window.dispatchEvent(new CustomEvent(OPEN_PREFERENCES_EVENT)); });

    const analyticsSwitch = await screen.findByRole('switch', { name: /mesure d'audience/i });
    fireEvent.click(analyticsSwitch);

    fireEvent.click(screen.getByRole('button', { name: /enregistrer mes choix/i }));

    await waitFor(() => {
      const state = readConsent();
      expect(state?.method).toBe('custom');
      expect(state?.analytics).toBe(true);
      expect(state?.marketing).toBe(false);
    });
    expect(requestMock).toHaveBeenCalled();
    const lastCall = requestMock.mock.calls.at(-1)!;
    expect((lastCall[2] as { body: any }).body).toMatchObject({ method: 'custom', analytics: true, marketing: false });
  });

  it('re-prompts on next mount after consent is revoked (expiration path)', async () => {
    // Simulate an expired stored consent → banner should reopen
    localStorage.setItem(
      'kilimo_cookie_consent',
      JSON.stringify({
        version: '1.0.0',
        necessary: true,
        analytics: true,
        marketing: true,
        preferences: true,
        method: 'accept_all',
        timestamp: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
        anonId: 'anon-test',
      }),
    );
    renderBanner();
    act(() => { vi.advanceTimersByTime(1000); });
    expect(await screen.findByRole('button', { name: /tout accepter/i })).toBeInTheDocument();
  });
});
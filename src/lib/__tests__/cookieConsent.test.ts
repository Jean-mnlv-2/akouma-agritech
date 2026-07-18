import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const requestMock = vi.fn().mockResolvedValue({});

vi.mock('@/integrations/api/client', () => ({
  api: { request: (...args: unknown[]) => requestMock(...args) },
}));

import {
  acceptAll,
  rejectAll,
  revokeConsent,
  saveConsent,
  readConsent,
  hasConsent,
  CONSENT_EVENT,
  CONSENT_MAX_AGE_MS,
  CONSENT_VERSION,
} from '@/lib/cookieConsent';

describe('cookieConsent core (E2E-style)', () => {
  beforeEach(() => {
    localStorage.clear();
    requestMock.mockClear();
  });
  afterEach(() => vi.useRealTimers());

  it('records "accept all" locally and persists to backend', async () => {
    await acceptAll();
    const state = readConsent();
    expect(state?.method).toBe('accept_all');
    expect(state?.analytics).toBe(true);
    expect(state?.marketing).toBe(true);
    expect(state?.preferences).toBe(true);
    expect(hasConsent('analytics')).toBe(true);
    expect(hasConsent('necessary')).toBe(true);

    expect(requestMock).toHaveBeenCalledTimes(1);
    const [method, path, opts] = requestMock.mock.calls[0] as [string, string, { body: any }];
    expect(method).toBe('POST');
    expect(path).toBe('/api/cookie-consents');
    expect(opts.body).toMatchObject({
      method: 'accept_all',
      analytics: true,
      marketing: true,
      preferences: true,
      version: CONSENT_VERSION,
    });
    expect(opts.body.anonId).toEqual(expect.any(String));
  });

  it('records custom preferences and rejects analytics/marketing separately', async () => {
    await saveConsent({ analytics: true, marketing: false, preferences: true, method: 'custom' });
    expect(hasConsent('analytics')).toBe(true);
    expect(hasConsent('marketing')).toBe(false);
    expect(hasConsent('preferences')).toBe(true);
  });

  it('emits a consent change event that gating listeners can subscribe to', async () => {
    const spy = vi.fn();
    window.addEventListener(CONSENT_EVENT, spy);
    await acceptAll();
    expect(spy).toHaveBeenCalledTimes(1);
    await rejectAll();
    expect(spy).toHaveBeenCalledTimes(2);
    window.removeEventListener(CONSENT_EVENT, spy);
  });

  it('re-prompts after CNIL 13-month expiration (readConsent returns null)', async () => {
    await acceptAll();
    const raw = JSON.parse(localStorage.getItem('kilimo_cookie_consent')!);
    raw.timestamp = new Date(Date.now() - CONSENT_MAX_AGE_MS - 1000).toISOString();
    localStorage.setItem('kilimo_cookie_consent', JSON.stringify(raw));
    expect(readConsent()).toBeNull();
  });

  it('re-prompts when the policy version changes', async () => {
    await acceptAll();
    const raw = JSON.parse(localStorage.getItem('kilimo_cookie_consent')!);
    raw.version = '0.0.1-old';
    localStorage.setItem('kilimo_cookie_consent', JSON.stringify(raw));
    expect(readConsent()).toBeNull();
  });

  it('revokes consent, clears non-essential cookies, and audits it server-side', async () => {
    document.cookie = 'auth_token=keep; path=/';
    document.cookie = '_ga=drop; path=/';
    await acceptAll();
    requestMock.mockClear();

    await revokeConsent();
    const state = readConsent();
    expect(state?.method).toBe('revoked');
    expect(state?.analytics).toBe(false);
    expect(state?.marketing).toBe(false);

    expect(requestMock).toHaveBeenCalledTimes(1);
    const body = (requestMock.mock.calls[0][2] as { body: any }).body;
    expect(body.method).toBe('revoked');

    // Essential cookies preserved, non-essential removed
    expect(document.cookie).toContain('auth_token=keep');
    expect(document.cookie).not.toContain('_ga=drop');
  });
});
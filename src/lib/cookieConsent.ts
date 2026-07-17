// Professional GDPR / CNIL-aligned cookie consent core.
// - Categories: necessary (always on), analytics, marketing, preferences
// - Persists locally + audits every choice server-side (via /api/cookie-consents)
// - Emits a browser event so any script/loader can react in real time
// - Re-prompts if the policy version changes or after 13 months (CNIL guidance)

import { api } from '@/integrations/api/client';

export const CONSENT_VERSION = '1.0.0';
export const CONSENT_MAX_AGE_MS = 13 * 30 * 24 * 60 * 60 * 1000; // ~13 months

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences';

export type ConsentState = {
  version: string;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  method: 'accept_all' | 'reject_all' | 'custom' | 'revoked';
  timestamp: string;
  anonId: string;
};

const LS_KEY = 'kilimo_cookie_consent';
const ANON_KEY = 'kilimo_anon_id';
export const CONSENT_EVENT = 'kilimo:cookie-consent';

function safeLocalStorage(): Storage | null {
  try { return window.localStorage; } catch { return null; }
}

function randomId(): string {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch { /* noop */ }
  return 'a_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getAnonId(): string {
  const ls = safeLocalStorage();
  if (!ls) return randomId();
  let id = ls.getItem(ANON_KEY);
  if (!id) {
    id = randomId();
    try { ls.setItem(ANON_KEY, id); } catch { /* noop */ }
  }
  return id;
}

export function readConsent(): ConsentState | null {
  const ls = safeLocalStorage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (!parsed?.version) return null;
    if (parsed.version !== CONSENT_VERSION) return null;
    const age = Date.now() - new Date(parsed.timestamp).getTime();
    if (!Number.isFinite(age) || age > CONSENT_MAX_AGE_MS) return null;
    return { ...parsed, necessary: true };
  } catch {
    return null;
  }
}

export function hasConsent(category: ConsentCategory): boolean {
  if (category === 'necessary') return true;
  const state = readConsent();
  return !!state?.[category];
}

function dispatchChange(state: ConsentState | null) {
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
  } catch { /* noop */ }
}

async function persistServer(state: ConsentState) {
  try {
    await api.request('POST', '/api/cookie-consents', {
      body: {
        anonId: state.anonId,
        version: state.version,
        necessary: true,
        analytics: state.analytics,
        marketing: state.marketing,
        preferences: state.preferences,
        method: state.method,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        locale: typeof navigator !== 'undefined' ? navigator.language?.slice(0, 10) : undefined,
      },
    });
  } catch (err) {
    // Non-blocking: local consent is already stored.
    console.warn('[consent] server persistence failed', err);
  }
}

export type ConsentInput = {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  method: ConsentState['method'];
};

export async function saveConsent(input: ConsentInput): Promise<ConsentState> {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: !!input.analytics,
    marketing: !!input.marketing,
    preferences: !!input.preferences,
    method: input.method,
    timestamp: new Date().toISOString(),
    anonId: getAnonId(),
  };
  const ls = safeLocalStorage();
  try { ls?.setItem(LS_KEY, JSON.stringify(state)); } catch { /* noop */ }
  dispatchChange(state);
  // Fire-and-forget; do not block the UI.
  void persistServer(state);
  return state;
}

export async function acceptAll() {
  return saveConsent({ analytics: true, marketing: true, preferences: true, method: 'accept_all' });
}

export async function rejectAll() {
  return saveConsent({ analytics: false, marketing: false, preferences: false, method: 'reject_all' });
}

export async function revokeConsent() {
  const state = await saveConsent({ analytics: false, marketing: false, preferences: false, method: 'revoked' });
  // Best-effort: clear known non-essential cookies so third parties are dropped.
  clearNonEssentialCookies();
  return state;
}

const ESSENTIAL_COOKIE_PREFIXES = ['auth_', 'refresh_', 'csrf_', 'kilimo_'];

export function clearNonEssentialCookies() {
  if (typeof document === 'undefined') return;
  const all = document.cookie ? document.cookie.split(';') : [];
  for (const raw of all) {
    const name = raw.split('=')[0]?.trim();
    if (!name) continue;
    if (ESSENTIAL_COOKIE_PREFIXES.some((p) => name.startsWith(p))) continue;
    // Try common scopes
    const host = window.location.hostname;
    const domains = [host, '.' + host, host.split('.').slice(-2).join('.'), '.' + host.split('.').slice(-2).join('.')];
    for (const d of new Set(domains)) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
    }
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}

export const OPEN_PREFERENCES_EVENT = 'kilimo:open-cookie-preferences';

export function openCookiePreferences() {
  try { window.dispatchEvent(new CustomEvent(OPEN_PREFERENCES_EVENT)); } catch { /* noop */ }
}
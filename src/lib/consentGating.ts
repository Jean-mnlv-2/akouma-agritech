// Loads analytics / marketing tags ONLY after explicit consent, and unloads them
// immediately when consent is revoked. Configure providers via Vite env vars:
//   VITE_GTM_CONTAINER_ID   (Google Tag Manager — Conversion Linker + GA4 tags
//                            "track_analytics"/"track_analytics_base" live in
//                            the GTM container itself, not here)
//   VITE_GA_MEASUREMENT_ID  (Google Analytics 4 direct gtag.js — fallback used
//                            only when VITE_GTM_CONTAINER_ID is unset, to avoid
//                            double-counting the same GA4 property)
//   VITE_META_PIXEL_ID      (Meta / Facebook Pixel)
import { CONSENT_EVENT, hasConsent, clearNonEssentialCookies, type ConsentState } from './cookieConsent';

const GTM_ID = import.meta.env.VITE_GTM_CONTAINER_ID as string | undefined;
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
const SCRIPT_ATTR = 'data-consent-tag';

// Deliberately never sets `.text`/inline content: the CSP script-src has no
// 'unsafe-inline' (see index.html), so every tag here loads as an external
// <script src="..."> instead of an inline snippet.
function injectScript(id: string, src: string) {
  if (document.querySelector(`script[${SCRIPT_ATTR}="${id}"]`)) return;
  const s = document.createElement('script');
  s.setAttribute(SCRIPT_ATTR, id);
  s.src = src;
  s.async = true;
  document.head.appendChild(s);
}

function removeTag(id: string) {
  document.querySelectorAll(`script[${SCRIPT_ATTR}="${id}"]`).forEach((n) => n.remove());
}

// Google Tag Manager loader, CSP-safe equivalent of the classic inline GTM
// snippet: dataLayer is set directly by this module (already an allowed
// 'self' script), and gtm.js is fetched as an external <script src>, so no
// inline script content is ever created.
function loadGTM() {
  if (!GTM_ID) return;
  if (document.querySelector(`script[${SCRIPT_ATTR}="gtm-loader"]`)) return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  injectScript('gtm-loader', `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`);
}

function unloadGTM() {
  removeTag('gtm-loader');
}

// Legacy direct GA4 loader (no GTM configured). Same CSP constraint as
// loadGTM: the dataLayer/gtag queue is set up by this module's own JS, and
// gtag.js is fetched as an external <script src>, so gtag('config', ...)
// commands are queued and processed once the external script loads.
function loadGA() {
  if (!GA_ID) return;
  if (document.querySelector(`script[${SCRIPT_ATTR}="ga-loader"]`)) return;
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function gtag(...args: unknown[]) { w.dataLayer!.push(args); };
  w.gtag('js', new Date());
  w.gtag('config', GA_ID, { anonymize_ip: true });
  injectScript('ga-loader', `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
}

function unloadGA() {
  removeTag('ga-loader');
  try { if (GA_ID) (window as any)[`ga-disable-${GA_ID}`] = true; } catch { /* noop */ }
}

function loadAnalytics() {
  if (GTM_ID) loadGTM(); else loadGA();
}

function unloadAnalytics() {
  if (GTM_ID) unloadGTM(); else unloadGA();
}

// Same CSP constraint as above: the fbq() queue stub is defined by this
// module's own JS (no inline <script> text), fbevents.js loads as an
// external <script src>, and init/PageView calls queue normally on fbq.
function loadMarketing() {
  if (!META_PIXEL_ID) return;
  if (document.querySelector(`script[${SCRIPT_ATTR}="meta-pixel-src"]`)) return;
  const w = window as any;
  if (!w.fbq) {
    const fbq: any = function (...args: unknown[]) {
      fbq.callMethod ? fbq.callMethod.apply(fbq, args) : fbq.queue.push(args);
    };
    w.fbq = fbq;
    if (!w._fbq) w._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
  }
  injectScript('meta-pixel-src', 'https://connect.facebook.net/en_US/fbevents.js');
  w.fbq('init', META_PIXEL_ID);
  w.fbq('track', 'PageView');
}

function unloadMarketing() {
  removeTag('meta-pixel-src');
  try { delete (window as any).fbq; delete (window as any)._fbq; } catch { /* noop */ }
}

function sync() {
  if (hasConsent('analytics')) loadAnalytics(); else unloadAnalytics();
  if (hasConsent('marketing')) loadMarketing(); else unloadMarketing();
}

let started = false;
export function initConsentGating() {
  if (started || typeof window === 'undefined') return;
  started = true;
  sync();
  window.addEventListener(CONSENT_EVENT, (e) => {
    const detail = (e as CustomEvent<ConsentState | null>).detail;
    if (detail && !detail.analytics && !detail.marketing && !detail.preferences) {
      clearNonEssentialCookies();
    }
    sync();
  });
}
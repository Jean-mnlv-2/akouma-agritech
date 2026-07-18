// Loads analytics / marketing tags ONLY after explicit consent, and unloads them
// immediately when consent is revoked. Configure providers via Vite env vars:
//   VITE_GA_MEASUREMENT_ID  (Google Analytics 4)
//   VITE_META_PIXEL_ID      (Meta / Facebook Pixel)
import { CONSENT_EVENT, hasConsent, clearNonEssentialCookies, type ConsentState } from './cookieConsent';

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
const SCRIPT_ATTR = 'data-consent-tag';

function injectScript(id: string, src: string, inline?: string) {
  if (document.querySelector(`script[${SCRIPT_ATTR}="${id}"]`)) return;
  const s = document.createElement('script');
  s.setAttribute(SCRIPT_ATTR, id);
  if (src) { s.src = src; s.async = true; }
  if (inline) s.text = inline;
  document.head.appendChild(s);
}

function removeTag(id: string) {
  document.querySelectorAll(`script[${SCRIPT_ATTR}="${id}"]`).forEach((n) => n.remove());
}

function loadAnalytics() {
  if (!GA_ID) return;
  injectScript('ga-loader', `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
  injectScript('ga-init', '',
    `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`);
}

function unloadAnalytics() {
  removeTag('ga-loader');
  removeTag('ga-init');
  try { if (GA_ID) (window as any)[`ga-disable-${GA_ID}`] = true; } catch { /* noop */ }
}

function loadMarketing() {
  if (!META_PIXEL_ID) return;
  injectScript('meta-pixel', '',
    `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.setAttribute('${SCRIPT_ATTR}','meta-pixel-src');t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`);
}

function unloadMarketing() {
  removeTag('meta-pixel');
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
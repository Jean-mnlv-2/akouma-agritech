// Pushes product/engagement events to window.dataLayer for the GTM
// container (Conversion Linker + GA4 tags configured there — see
// consentGating.ts for the container loader itself). Every push is gated
// by analytics consent, matching the rest of the consent-gated tracking in
// this codebase: no dataLayer activity happens before the user opts in, and
// GTM's own "History Change"/"Custom Event" triggers only ever see data
// that respects that choice.
//
// No message content, free-text, or other PII is ever pushed — only ids,
// amounts and currencies already shown to the user in the UI.
import { hasConsent } from './cookieConsent';

type DataLayerEvent = Record<string, unknown>;

function push(event: DataLayerEvent) {
  if (!hasConsent('analytics')) return;
  const w = window as unknown as { dataLayer?: DataLayerEvent[] };
  if (!w.dataLayer) return;
  w.dataLayer.push(event);
}

// Virtual pageview for SPA route changes: GTM only fires its native
// "Page View"/"gtm.js" trigger once, on initial container load, because
// react-router-dom never triggers a full navigation. If your GTM triggers
// are "History Change", this is redundant (GTM already patches
// history.pushState itself) — this event is a complementary fallback for
// "Custom Event" triggers listening for `page_view`.
export function trackPageview(path: string) {
  push({
    event: 'page_view',
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export interface PurchaseOrder {
  id: number | string;
  orderNumber: string;
  total: number;
  shipping: number;
  discount: number;
  items: Array<{ id: number | string; name: string; price: number; quantity: number; productType: string }>;
}

const PURCHASE_TRACKED_PREFIX = 'kilimo_ga_purchase_tracked_';

// GA4 recommended "purchase" ecommerce event. Fire only once the payment is
// actually confirmed (order.paymentStatus === 'paid'), never at checkout
// submission time — payment happens off-site via MoneyFusion redirect, so
// "order created" and "order paid" are two different moments.
// Deduped via localStorage: OrderDetail re-fetches/re-renders on every
// auto-refresh poll and on every future visit to the same order, and a
// purchase event must fire exactly once per transaction.
export function trackPurchase(order: PurchaseOrder) {
  const key = PURCHASE_TRACKED_PREFIX + order.id;
  try {
    if (localStorage.getItem(key)) return;
  } catch { /* noop */ }

  push({
    event: 'purchase',
    ecommerce: {
      transaction_id: order.orderNumber,
      value: order.total,
      shipping: order.shipping,
      discount: order.discount,
      currency: 'XOF',
      items: order.items.map((item) => ({
        item_id: String(item.id),
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.productType,
      })),
    },
  });

  try { localStorage.setItem(key, '1'); } catch { /* noop */ }
}

// GA4 "donate" recommended event.
export function trackDonation(amount: number) {
  push({
    event: 'donate',
    value: amount,
    currency: 'EUR',
  });
}

// Lightweight engagement events for the RAG assistant — intentionally no
// thread id or message content, only that an interaction happened.
export function trackAssistantConversationStarted() {
  push({ event: 'assistant_conversation_started' });
}

export function trackAssistantMessageSent() {
  push({ event: 'assistant_message_sent' });
}

// GA4 recommended "generate_lead" event, shared by every public lead-gen
// form on the platform (contact, partnerships, careers, demo request,
// content submission). `formName` identifies which one — never the
// submitted values themselves (name/email/message stay out of dataLayer).
export function trackLead(formName: string) {
  push({ event: 'generate_lead', form_name: formName });
}

// GA4 standard events.
export function trackSignUp(method: string) {
  push({ event: 'sign_up', method });
}

export function trackLogin(method: string) {
  push({ event: 'login', method });
}

// Outbound click to a partner site (e.g. Ekolo) — useful for the Conversion
// Linker / GA4 to attribute traffic handed off to a partner domain.
export function trackOutboundClick(destination: string, linkUrl: string) {
  push({ event: 'click', link_domain: destination, link_url: linkUrl, outbound: true });
}

// GA4 recommended "select_content" event for content cards (news articles,
// etc.) — item id/slug only, no article body.
export function trackSelectContent(contentType: string, itemId: string) {
  push({ event: 'select_content', content_type: contentType, item_id: itemId });
}

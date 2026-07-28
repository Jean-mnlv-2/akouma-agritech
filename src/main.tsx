import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import './index.css'
import { I18nProvider } from '@/i18n/i18n'
import { initConsentGating } from '@/lib/consentGating'

initConsentGating();

// Laisser VITE_SENTRY_DSN vide désactive totalement le tracking d'erreurs :
// aucun appel réseau, aucun comportement modifié. Renseigner un DSN Sentry
// projet dans .env pour l'activer.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
  });
}

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
    <HelmetProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </HelmetProvider>
  </Sentry.ErrorBoundary>
);

function ErrorFallback() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Une erreur inattendue est survenue</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Nos équipes ont été notifiées. Merci de recharger la page.</p>
      <button
        onClick={() => window.location.reload()}
        style={{ padding: '10px 20px', borderRadius: 8, background: '#22c55e', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Recharger la page
      </button>
    </div>
  );
}

import { useRef, useState } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      enterprise?: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

interface UseRecaptchaOptions {
  siteKey?: string;
  useEnterprise?: boolean;
}

// Le script reCAPTCHA (~335 Ko, 1-2s de CPU pour l'initialiser) est
// partagé par plusieurs formulaires (newsletter, contact, dons,
// candidature...) qui vivent tous dans des composants montés en
// permanence (ex: NewsletterForm dans le Footer, présent sur chaque
// page). Le charger au montage pénalisait donc CHAQUE chargement de
// page, même pour les visiteurs qui ne soumettent jamais un formulaire.
// On ne l'injecte désormais qu'au premier appel réel de execute() —
// c'est-à-dire au moment de la soumission, le seul moment où il sert.
let scriptLoadPromise: Promise<boolean> | null = null;

function loadRecaptchaScript(siteKey: string, useEnterprise: boolean): Promise<boolean> {
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve) => {
    const existing = useEnterprise ? window.grecaptcha?.enterprise : window.grecaptcha;
    if (existing) {
      existing.ready(() => resolve(true));
      return;
    }

    const script = document.createElement('script');
    script.src = useEnterprise
      ? `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`
      : `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const recaptchaInstance = useEnterprise ? window.grecaptcha?.enterprise : window.grecaptcha;
      if (recaptchaInstance) {
        recaptchaInstance.ready(() => resolve(true));
      } else if (window.grecaptcha) {
        window.grecaptcha.ready(() => resolve(true));
      } else {
        console.error('[reCAPTCHA] grecaptcha not found after script load');
        resolve(false);
      }
    };
    script.onerror = () => {
      console.error('[reCAPTCHA] Failed to load script, continuing without reCAPTCHA');
      resolve(false);
    };

    document.body.appendChild(script);
  });

  return scriptLoadPromise;
}

export function useRecaptcha(options: UseRecaptchaOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const siteKey = options.siteKey || import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const useEnterprise = options.useEnterprise ?? false;
  const siteKeyRef = useRef(siteKey);
  siteKeyRef.current = siteKey;

  const execute = async (action: string): Promise<string | null> => {
    const key = siteKeyRef.current;
    if (!key || hasError) return null;

    setIsExecuting(true);
    try {
      const loaded = await loadRecaptchaScript(key, useEnterprise);
      setIsLoaded(loaded);
      if (!loaded) {
        setHasError(true);
        return null;
      }
      const recaptchaInstance = (useEnterprise ? window.grecaptcha?.enterprise : null) || window.grecaptcha;
      if (!recaptchaInstance) {
        console.error('[reCAPTCHA] grecaptcha not available');
        return null;
      }
      return await recaptchaInstance.execute(key, { action });
    } catch (error) {
      console.error('[reCAPTCHA] Execution error, continuing without token:', error);
      return null;
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    isLoaded,
    isExecuting,
    execute,
    isEnabled: !!siteKey && !hasError,
  };
}

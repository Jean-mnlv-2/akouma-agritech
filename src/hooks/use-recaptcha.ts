import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface UseRecaptchaOptions {
  siteKey?: string;
}

export function useRecaptcha(options: UseRecaptchaOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const scriptLoadedRef = useRef(false);
  const siteKey = options.siteKey || import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    // Don't load recaptcha if site key not provided
    if (!siteKey) {
      console.warn('[reCAPTCHA] VITE_RECAPTCHA_SITE_KEY not set, skipping');
      setIsLoaded(true);
      return;
    }

    // Check if script is already loaded
    if (scriptLoadedRef.current) {
      return;
    }

    // Load the reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.grecaptcha?.ready(() => {
        scriptLoadedRef.current = true;
        setIsLoaded(true);
      });
    };

    script.onerror = () => {
      console.error('[reCAPTCHA] Failed to load script');
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove the script, since other components might use it
    };
  }, [siteKey]);

  const execute = async (action: string): Promise<string | null> => {
    // If no site key, return null (for development without recaptcha)
    if (!siteKey) {
      return null;
    }

    if (!isLoaded) {
      throw new Error('reCAPTCHA not loaded yet');
    }

    if (!window.grecaptcha) {
      throw new Error('reCAPTCHA not available');
    }

    setIsExecuting(true);
    try {
      const token = await window.grecaptcha.execute(siteKey, { action });
      return token;
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    isLoaded,
    isExecuting,
    execute,
    isEnabled: !!siteKey,
  };
}

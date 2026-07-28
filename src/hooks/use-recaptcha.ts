import { useState, useEffect, useRef } from 'react';

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

export function useRecaptcha(options: UseRecaptchaOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const scriptLoadedRef = useRef(false);
  const siteKey = options.siteKey || import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const useEnterprise = options.useEnterprise ?? false;

  useEffect(() => {
    console.log('[reCAPTCHA] Initializing hook...');
    console.log('[reCAPTCHA] Site key:', siteKey ? '***' : 'not set');
    console.log('[reCAPTCHA] Use Enterprise:', useEnterprise);

    // Don't load recaptcha if site key not provided
    if (!siteKey) {
      console.warn('[reCAPTCHA] VITE_RECAPTCHA_SITE_KEY not set, skipping');
      setIsLoaded(true);
      return;
    }

    // Check if script is already loaded
    if (scriptLoadedRef.current) {
      console.log('[reCAPTCHA] Script already loaded');
      return;
    }

    console.log('[reCAPTCHA] Loading script...');

    // Load the appropriate reCAPTCHA script
    const script = document.createElement('script');
    script.src = useEnterprise 
      ? `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`
      : `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('[reCAPTCHA] Script loaded');
      const recaptchaInstance = useEnterprise ? window.grecaptcha?.enterprise : window.grecaptcha;
      
      if (recaptchaInstance) {
        recaptchaInstance.ready(() => {
          console.log('[reCAPTCHA] Ready');
          scriptLoadedRef.current = true;
          setIsLoaded(true);
        });
      } else {
        console.warn('[reCAPTCHA] Enterprise not found, trying regular v3');
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => {
            console.log('[reCAPTCHA] v3 Ready');
            scriptLoadedRef.current = true;
            setIsLoaded(true);
          });
        } else {
          console.error('[reCAPTCHA] grecaptcha not found after script load');
          setHasError(true);
          setIsLoaded(true);
        }
      }
    };

    script.onerror = () => {
      console.error('[reCAPTCHA] Failed to load script, continuing without reCAPTCHA');
      setHasError(true);
      setIsLoaded(true);
    };

    document.body.appendChild(script);

    return () => {
      // Don't remove the script, since other components might use it
    };
  }, [siteKey, useEnterprise]);

  const execute = async (action: string): Promise<string | null> => {
    console.log('[reCAPTCHA] Executing with action:', action);
    
    // If no site key or we had an error, return null
    if (!siteKey || hasError) {
      console.log('[reCAPTCHA] No site key or error, skipping execution');
      return null;
    }

    if (!isLoaded) {
      console.error('[reCAPTCHA] Not loaded yet');
      return null;
    }

    // Try enterprise first, then regular v3
    let recaptchaInstance = useEnterprise ? window.grecaptcha?.enterprise : null;
    if (!recaptchaInstance) {
      recaptchaInstance = window.grecaptcha;
    }
    
    if (!recaptchaInstance) {
      console.error('[reCAPTCHA] grecaptcha not available');
      return null;
    }

    setIsExecuting(true);
    try {
      console.log('[reCAPTCHA] Calling execute...');
      const token = await recaptchaInstance.execute(siteKey, { action });
      console.log('[reCAPTCHA] Token received');
      return token;
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

import { Request, Response, NextFunction } from 'express';
import { env } from '../utils/env';

interface RecaptchaVerificationResponse {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  score: number;
  action: string;
  'error-codes'?: string[];
}

/**
 * Middleware to verify Google reCAPTCHA v3 or reCAPTCHA Enterprise token
 * For reCAPTCHA Enterprise, verification is handled on Google's side,
 * so we just check if the token is present if RECAPTCHA_SECRET_KEY is not set
 * @param action
 * @param minScore
 */
export function verifyRecaptcha(
  action: string,
  minScore: number = 0.5
) {
  return async (req: Request, res: Response, next: NextFunction) => {

    if (!env.RECAPTCHA_SECRET_KEY) {
      if (env.isProduction()) {
        // Ne jamais laisser passer une requête sensible sans vérification en production :
        // une clé manquante ne doit jamais se traduire par un contournement silencieux.
        console.error('[reCAPTCHA] RECAPTCHA_SECRET_KEY manquant en production. Requête bloquée.');
        return res.status(503).json({ error: 'Service de vérification anti-abus indisponible' });
      }
      console.warn('[reCAPTCHA] RECAPTCHA_SECRET_KEY not set. Skipping server-side verification (dev only).');
      return next();
    }

    const recaptchaToken = req.body.recaptchaToken;

    if (!recaptchaToken) {
      return res.status(400).json({ error: 'reCAPTCHA token missing' });
    }

    try {
      const verificationUrl = new URL('https://www.google.com/recaptcha/api/siteverify');
      verificationUrl.searchParams.set('secret', env.RECAPTCHA_SECRET_KEY);
      verificationUrl.searchParams.set('response', recaptchaToken);
      verificationUrl.searchParams.set('remoteip', req.ip || '');

      const response = await fetch(verificationUrl.toString(), {
        method: 'POST'
      });

      const data = (await response.json()) as RecaptchaVerificationResponse;

      if (!data.success) {
        console.error('[reCAPTCHA] Verification failed:', data['error-codes']);
        return res.status(400).json({ error: 'reCAPTCHA verification failed' });
      }

      if (data.action !== action) {
        console.error('[reCAPTCHA] Action mismatch:', data.action, 'expected:', action);
        return res.status(400).json({ error: 'reCAPTCHA action mismatch' });
      }

      if (data.score < minScore) {
        console.error('[reCAPTCHA] Score too low:', data.score);
        return res.status(400).json({ error: 'reCAPTCHA verification failed' });
      }

      next();
    } catch (error) {
      console.error('[reCAPTCHA] Error during verification:', error);
      return res.status(500).json({ error: 'reCAPTCHA verification error' });
    }
  };
}

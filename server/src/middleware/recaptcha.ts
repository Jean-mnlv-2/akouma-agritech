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
 * Middleware to verify Google reCAPTCHA v3 token
 * @param action
 * @param minScore
 */
export function verifyRecaptcha(
  action: string,
  minScore: number = 0.5
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip verification in development if secret key not set
    if (!env.RECAPTCHA_SECRET_KEY) {
      if (env.isDevelopment()) {
        console.warn('[reCAPTCHA] RECAPTCHA_SECRET_KEY not set, skipping verification');
        return next();
      }
      return res.status(500).json({ error: 'reCAPTCHA configuration missing' });
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

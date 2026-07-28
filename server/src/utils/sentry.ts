import * as Sentry from '@sentry/node';
import { env } from './env';
import { logger } from './logger';

let initialized = false;

/**
 * Initialise Sentry uniquement si SENTRY_DSN est renseigné. Sans DSN, cette
 * fonction est un no-op total : aucun appel réseau, aucun comportement
 * modifié. C'est le point d'activation unique de l'observabilité backend.
 */
export function initSentry(): void {
  if (!env.SENTRY_DSN || initialized) return;
  initialized = true;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    // Échantillonnage conservateur : la trace de perf n'est pas l'objectif
    // premier ici (capture d'erreurs), on évite un volume/coût inutile.
    tracesSampleRate: env.isProduction() ? 0.1 : 0,
  });
  logger.info('[sentry] error tracking enabled');
}

export function isSentryEnabled(): boolean {
  return initialized;
}

export { Sentry };

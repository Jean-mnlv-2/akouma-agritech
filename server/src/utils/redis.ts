import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

/**
 * Client Redis partagé, optionnel : sans REDIS_URL configuré (dev par défaut),
 * getRedisClient() renvoie null et les appelants (ex: rateLimit.ts) retombent
 * sur une stratégie locale. Avec REDIS_URL défini, il permet un état partagé
 * entre plusieurs instances du backend (rate-limiting distribué notamment).
 */
let client: Redis | null = null;
let initialized = false;
let loggedUnavailable = false;

export function getRedisClient(): Redis | null {
  if (!env.REDIS_URL) return null;

  if (!initialized) {
    initialized = true;
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy: (times) => Math.min(times * 200, 5000),
      lazyConnect: false,
    });
    client.on('error', (err) => {
      if (!loggedUnavailable) {
        loggedUnavailable = true;
        logger.warn(`[redis] connexion indisponible, repli sur le stockage local en mémoire (${err.message})`);
      }
    });
    client.on('ready', () => {
      loggedUnavailable = false;
      logger.info('[redis] connecté');
    });
  }

  return client;
}

/** Vrai uniquement si le client Redis est réellement prêt à servir des commandes. */
export function isRedisReady(): boolean {
  return getRedisClient()?.status === 'ready';
}

import { Request, Response, NextFunction } from 'express';
import { getRedisClient, isRedisReady } from '../utils/redis';
import { logger } from '../utils/logger';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
};

// ---------------------------------------------------------------------------
// Repli en mémoire (mono-instance / développement / Redis indisponible)
// ---------------------------------------------------------------------------

type StoreEntry = {
  timestamps: number[];
};

const stores = new Map<string, StoreEntry>();

// Purge périodique des entrées expirées : sans cela la Map grossit indéfiniment
// (une clé par IP/route/méthode jamais revue), ce qui finit par épuiser la
// mémoire du processus sous trafic soutenu.
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweepMemoryStore(now: number, windowMs: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of stores.entries()) {
    const fresh = entry.timestamps.filter((t) => now - t < windowMs);
    if (fresh.length === 0) {
      stores.delete(key);
    } else if (fresh.length !== entry.timestamps.length) {
      stores.set(key, { timestamps: fresh });
    }
  }
}

/** true si la requête est autorisée (sous la limite). */
function checkMemoryLimit(storeKey: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  sweepMemoryStore(now, windowMs);
  const entry = stores.get(storeKey) || { timestamps: [] };
  const freshTimestamps = entry.timestamps.filter((t) => now - t < windowMs);
  if (freshTimestamps.length >= max) {
    return false;
  }
  freshTimestamps.push(now);
  stores.set(storeKey, { timestamps: freshTimestamps });
  return true;
}

// ---------------------------------------------------------------------------
// Backend Redis (multi-instance) — fenêtre glissante via sorted set, exécutée
// atomiquement par un script Lua pour éviter toute course entre le comptage
// et l'incrément (deux requêtes concurrentes ne peuvent pas toutes les deux
// passer alors que la limite est déjà atteinte).
// ---------------------------------------------------------------------------

const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local max = tonumber(ARGV[3])
local member = ARGV[4]
local windowStart = now - window

redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
local count = redis.call('ZCARD', key)
if count >= max then
  redis.call('PEXPIRE', key, window)
  return 0
end
redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, window)
return 1
`;

async function checkRedisLimit(storeKey: string, windowMs: number, max: number): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) throw new Error('redis_unavailable');
  const now = Date.now();
  const member = `${now}-${Math.random().toString(36).slice(2)}`;
  const result = await redis.eval(SLIDING_WINDOW_SCRIPT, 1, `ratelimit:${storeKey}`, now, windowMs, max, member);
  return result === 1;
}

/**
 * Identifiant de requête par défaut basé sur `req.ip`, qu'Express calcule déjà
 * en tenant compte de `app.set('trust proxy', ...)`. Ne jamais lire
 * `x-forwarded-for` directement : cet en-tête est fourni par le client et
 * peut être falsifié pour contourner la limite (une IP différente à chaque
 * requête = jamais throttled).
 */
function defaultKeyGenerator(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function createRateLimiter(options: RateLimitOptions) {
  const windowMs = options.windowMs;
  const max = options.max;
  const keyGenerator = options.keyGenerator || defaultKeyGenerator;

  return function rateLimiter(req: Request, res: Response, next: NextFunction): void | Promise<void> {
    const key = keyGenerator(req);
    const storeKey = `${req.method}:${req.baseUrl || req.path}:${key}`;

    // Chemin synchrone (pas de Redis configuré / non prêt) : comportement
    // identique à un middleware classique, aucune latence réseau ajoutée.
    if (!isRedisReady()) {
      const allowed = checkMemoryLimit(storeKey, windowMs, max);
      if (!allowed) {
        res.status(429).json({ error: 'Too many requests, please try again later.' });
        return;
      }
      next();
      return;
    }

    return checkRedisLimit(storeKey, windowMs, max)
      .then((allowed) => {
        if (!allowed) {
          res.status(429).json({ error: 'Too many requests, please try again later.' });
          return;
        }
        next();
      })
      .catch((err) => {
        // Redis a basculé indisponible entre le check de statut et l'appel :
        // on ne bloque jamais une requête légitime pour une panne d'infra
        // annexe, on retombe sur la limite locale de cette instance.
        logger.warn('[rateLimit] Redis eval a échoué, repli mémoire', err instanceof Error ? err.message : String(err));
        const allowed = checkMemoryLimit(storeKey, windowMs, max);
        if (!allowed) {
          res.status(429).json({ error: 'Too many requests, please try again later.' });
          return;
        }
        next();
      });
  };
}

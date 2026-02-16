import { Request, Response, NextFunction } from 'express';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
};

type StoreEntry = {
  timestamps: number[];
};

const stores = new Map<string, StoreEntry>();

export function createRateLimiter(options: RateLimitOptions) {
  const windowMs = options.windowMs;
  const max = options.max;
  const keyGenerator =
    options.keyGenerator ||
    ((req: Request) => {
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      return String(ip);
    });

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    const key = keyGenerator(req);
    const storeKey = `${req.method}:${req.baseUrl || req.path}:${key}`;
    const entry = stores.get(storeKey) || { timestamps: [] };
    const freshTimestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (freshTimestamps.length >= max) {
      res.status(429).json({ error: 'Too many requests, please try again later.' });
      return;
    }
    freshTimestamps.push(now);
    stores.set(storeKey, { timestamps: freshTimestamps });
    next();
  };
}


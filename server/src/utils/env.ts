/**
 * Chargement robuste des variables d'environnement avec valeurs par défaut
 * Les valeurs manquantes échouent uniquement en production.
 */

type FallbackOptions = {
  defaultValue: string;
  description: string;
};

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const isProduction = NODE_ENV === 'production';
const isDevelopment = NODE_ENV === 'development';

const DEFAULTS = {
  PORT: 4000,
  JWT_SECRET: 'dev_secret_change_me',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/akouma?schema=public',
  FRONTEND_ORIGIN: 'http://localhost:8080,http://localhost:5173',
};

function readEnv(key: string, fallback?: FallbackOptions): string {
  const value = process.env[key];
  if (value && value.trim().length > 0) {
    return value.trim();
  }

  if (!isProduction && fallback) {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.warn(`[env] "${key}" manquant. Utilisation de la valeur par défaut pour le développement (${fallback.description}).`);
    }
    return fallback.defaultValue;
  }

  throw new Error(`Variable d'environnement manquante: ${key}`);
}

function readNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

const PORT = readNumber('PORT', DEFAULTS.PORT);
const FRONTEND_ORIGIN_RAW = readEnv('FRONTEND_ORIGIN', {
  defaultValue: DEFAULTS.FRONTEND_ORIGIN,
  description: DEFAULTS.FRONTEND_ORIGIN,
});

const FRONTEND_ORIGINS = FRONTEND_ORIGIN_RAW.split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const DATABASE_URL = readEnv('DATABASE_URL', {
  defaultValue: DEFAULTS.DATABASE_URL,
  description: 'PostgreSQL local (postgres/postgres)',
});

const JWT_SECRET = readEnv('JWT_SECRET', {
  defaultValue: DEFAULTS.JWT_SECRET,
  description: 'clé JWT de développement',
});

export const env = {
  NODE_ENV,
  PORT,
  JWT_SECRET,
  DATABASE_URL,
  FRONTEND_ORIGINS,
  API_PUBLIC_URL: process.env.API_PUBLIC_URL ?? `http://localhost:${PORT}`,
  isProduction: () => isProduction,
  isDevelopment: () => isDevelopment,
  validateSecrets: () => {
    if (isProduction) {
      if (JWT_SECRET.length < 32 || JWT_SECRET === DEFAULTS.JWT_SECRET) {
        throw new Error('JWT_SECRET doit être défini et avoir au moins 32 caractères en production');
      }
    }
  },
};

// Validation au démarrage
env.validateSecrets();


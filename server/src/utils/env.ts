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
  FRONTEND_ORIGINS: 'http://localhost:8080,http://localhost:5173',
  DEFAULT_ADMIN_EMAIL: 'admin@akouma.test',
  DEFAULT_ADMIN_PASSWORD: 'Admin123!',
  DEFAULT_ADMIN_FULL_NAME: 'AKOUMA Admin',
  MONEYFUSION_WEBHOOK_SECRET: 'dev_webhook_secret_12345',
};

function readEnv(key: string, fallback?: FallbackOptions): string {
  const value = process.env[key] || process.env[key.replace(/S$/, '')];
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
const FRONTEND_ORIGIN_RAW = readEnv('FRONTEND_ORIGINS', {
  defaultValue: DEFAULTS.FRONTEND_ORIGINS,
  description: DEFAULTS.FRONTEND_ORIGINS,
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

const DEFAULT_ADMIN_EMAIL = readEnv('DEFAULT_ADMIN_EMAIL', {
  defaultValue: DEFAULTS.DEFAULT_ADMIN_EMAIL,
  description: DEFAULTS.DEFAULT_ADMIN_EMAIL,
});

const DEFAULT_ADMIN_PASSWORD = readEnv('DEFAULT_ADMIN_PASSWORD', {
  defaultValue: DEFAULTS.DEFAULT_ADMIN_PASSWORD,
  description: 'mot de passe administrateur de développement',
});

const DEFAULT_ADMIN_FULL_NAME = (process.env.DEFAULT_ADMIN_FULL_NAME ?? DEFAULTS.DEFAULT_ADMIN_FULL_NAME).trim();
const DEFAULT_ADMIN_FORCE_RESET = (process.env.DEFAULT_ADMIN_FORCE_RESET ?? '').toLowerCase() === 'true';

export const env = {
  NODE_ENV,
  PORT,
  JWT_SECRET,
  DATABASE_URL,
  FRONTEND_ORIGINS,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_FULL_NAME,
  DEFAULT_ADMIN_FORCE_RESET,
  API_PUBLIC_URL: process.env.API_PUBLIC_URL ?? `http://localhost:${PORT}`,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM || 'AKOUMA <noreply@akouma.com>',
  isProduction: () => isProduction,
  isDevelopment: () => isDevelopment,
  MONEYFUSION_WEBHOOK_SECRET: readEnv('MONEYFUSION_WEBHOOK_SECRET', {
    defaultValue: DEFAULTS.MONEYFUSION_WEBHOOK_SECRET,
    description: 'clé secrète pour les webhooks MoneyFusion',
  }),
  validateSecrets: () => {
    if (isProduction) {
      if (JWT_SECRET.length < 32 || JWT_SECRET === DEFAULTS.JWT_SECRET) {
        throw new Error('JWT_SECRET doit être défini et avoir au moins 32 caractères en production');
      }
      if (DEFAULT_ADMIN_EMAIL === DEFAULTS.DEFAULT_ADMIN_EMAIL) {
        throw new Error(`DEFAULT_ADMIN_EMAIL doit être défini en production (ne peut pas être "${DEFAULTS.DEFAULT_ADMIN_EMAIL}")`);
      }
      if (DEFAULT_ADMIN_PASSWORD === DEFAULTS.DEFAULT_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD.length < 8) {
        throw new Error('DEFAULT_ADMIN_PASSWORD doit être défini en production, différer de la valeur par défaut et contenir au moins 8 caractères');
      }
    }
  },
};

// Validation au démarrage
env.validateSecrets();


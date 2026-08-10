const SERTIFIER_BASE = 'https://b2b.sertifier.com';
const API_VERSION = '3.3';

export function isSertifierConfigured(): boolean {
  return !!process.env.SERTIFIER_SECRET_KEY;
}

function headers(): Record<string, string> {
  const secretKey = process.env.SERTIFIER_SECRET_KEY;
  if (!secretKey) throw new Error('SERTIFIER_SECRET_KEY not configured');
  return {
    'Content-Type': 'application/json',
    'api-version': API_VERSION,
    'secretKey': secretKey,
  };
}

export async function sertifierFetch(method: string, path: string, body?: unknown) {
  const res = await fetch(`${SERTIFIER_BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Sertifier ${method} ${path}: ${res.status} - ${text}`);
  }
  const json = await res.json();
  // Sertifier enveloppe toutes ses réponses dans { message, hasError,
  // validationErrors, data, content } — une erreur métier/validation revient
  // en HTTP 200 avec hasError:true, jamais en 4xx/5xx. Sans cette vérif,
  // "!res.ok" ne se déclenche jamais et l'appelant croit systématiquement
  // au succès (ex. une campagne jamais réellement envoyée).
  if (json && typeof json === 'object' && json.hasError) {
    const details = Array.isArray(json.validationErrors) && json.validationErrors.length > 0
      ? json.validationErrors.join('; ')
      : json.message || 'Unknown error';
    throw new Error(`Sertifier ${method} ${path}: ${details}`);
  }
  return json;
}

// Validates that an ID looks like a Sertifier identifier (Mongo ObjectId-like or alphanumeric token >= 8 chars)
export function isValidSertifierId(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (v.length < 8 || v.length > 64) return false;
  return /^[A-Za-z0-9_-]+$/.test(v);
}

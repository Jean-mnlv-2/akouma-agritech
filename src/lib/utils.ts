import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Échappe les caractères HTML spéciaux d'une valeur avant de l'interpoler
 * dans du HTML construit à la main (ex: `document.write`, exports PDF/print).
 * À utiliser chaque fois que du HTML est assemblé par concaténation de
 * chaînes plutôt que par le DOM/React — sans quoi une valeur utilisateur
 * (nom, email...) contenant du balisage s'exécute dans la page.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

/**
 * Validates a payment URL to prevent open redirect vulnerabilities
 * @param url - The payment URL to validate
 * @returns boolean indicating if the URL is safe
 */
export function validatePaymentUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Require HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }
    
    // Allow only trusted payment provider hosts
    // Note: This should match the server-side whitelist
    // For now, we'll accept any HTTPS URL as we don't know the exact Money Fusion host
    // TODO: Update with actual allowed hosts when known
    return true;
  } catch {
    // Invalid URL format
    return false;
  }
}

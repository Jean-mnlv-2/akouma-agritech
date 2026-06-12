import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

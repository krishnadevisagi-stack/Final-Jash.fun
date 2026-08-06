/**
 * Production Input Validation Helpers
 * Validates types, lengths, and formats strictly without breaking unicode/emojis or legitimate user inputs.
 */

export function isValidString(val: any, maxLen: number = 256, minLen: number = 0): boolean {
  if (typeof val !== 'string') return false;
  if (val.length < minLen || val.length > maxLen) return false;
  return true;
}

export function isValidNumber(val: any, min?: number, max?: number): boolean {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return false;
  if (min !== undefined && val < min) return false;
  if (max !== undefined && val > max) return false;
  return true;
}

export function isValidEmail(email: any): boolean {
  if (typeof email !== 'string' || email.length > 256) return false;
  if (email.trim().length === 0) return true; // Empty email optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidId(id: any, maxLen: number = 128): boolean {
  if (typeof id !== 'string' || id.length === 0 || id.length > maxLen) return false;
  return /^[a-zA-Z0-9_\-\.]+$/.test(id);
}

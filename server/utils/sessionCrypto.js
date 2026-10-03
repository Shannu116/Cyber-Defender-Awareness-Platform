import crypto from 'crypto';

// Unambiguous 32-character alphabet (excludes 0, O, 1, I)
const RESUME_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Normalizes participant name for unique indexing:
 * - Trims edges
 * - Collapses consecutive whitespace to a single space
 * - Converts to lowercase
 * - Strips diacritics / accents via Unicode NFD normalization
 */
export function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Validates participant name format:
 * - 2 to 60 characters
 * - Unicode letters, spaces, dots (.), apostrophes ('), hyphens (-)
 */
export function isValidName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 60) return false;
  // \p{L} matches any unicode letter, \p{M} matches combining marks
  const nameRegex = /^[\p{L}\p{M}\s.'-]+$/u;
  return nameRegex.test(trimmed);
}

/**
 * Validates optional email format:
 * - Max 254 characters
 * - Standard RFC-compliant shape
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > 254) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

/**
 * Generates an 8-character unambiguous resume code formatted as XXXX-XXXX
 */
export function generateResumeCode() {
  const bytes = crypto.randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    const index = bytes[i] % RESUME_ALPHABET.length;
    code += RESUME_ALPHABET[index];
    if (i === 3) {
      code += '-';
    }
  }
  return code;
}

/**
 * Normalizes user-entered resume code for matching:
 * Removes hyphens, spaces, and forces uppercase.
 */
export function normalizeResumeCode(code) {
  if (!code || typeof code !== 'string') return '';
  const raw = code.replace(/[-\s]/g, '').toUpperCase();
  if (raw.length === 8) {
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  }
  return raw;
}

/**
 * Generates a random cryptographic 256-bit device token
 */
export function generateDeviceToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * SHA-256 hashes a device token for secure persistence
 */
export function hashDeviceToken(token) {
  if (!token || typeof token !== 'string') return '';
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

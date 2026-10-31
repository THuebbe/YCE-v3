/**
 * Invite tokens and access codes. Only their SHA-256 is stored, so a leaked
 * database row can't be turned back into a working link or code.
 */
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

export const hashSecret = (value: string) => createHash('sha256').update(value.trim()).digest('hex');

/** The secret in a demo link: 32 random bytes, URL-safe */
export const newInviteToken = () => randomBytes(32).toString('base64url');

/** Well-formed tokens only, so junk never reaches the database */
export const isInviteToken = (value: string) => /^[A-Za-z0-9_-]{43}$/.test(value);

// No 0/O, 1/I/L: the code gets typed from an email, often on a phone
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;

export function newAccessCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

/** What the prospect typed, as a code: case, spaces and dashes don't matter */
export const normalizeCode = (typed: string) => typed.toUpperCase().replace(/[\s-]/g, '');

/** Compare a typed code with the stored hash in constant time */
export function codeMatches(typed: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false;
  const a = Buffer.from(hashSecret(normalizeCode(typed)), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

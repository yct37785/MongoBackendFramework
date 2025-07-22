import bcrypt from 'bcryptjs';
import crypto from 'crypto';
const SALT_ROUNDS: number = Number(process.env.SALT_ROUNDS);
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

/******************************************************************************************************************
 * Hashes a raw string using bcrypt.
 *
 * @param raw - The plaintext value (e.g. password or refresh token)
 * @returns A promise that resolves to a securely hashed version of the input
 *
 * Usage:
 * const hashed = await hashValue('my_password');
 *
 * Recommended for:
 * - Password hashing
 ******************************************************************************************************************/
export async function hashValue(raw: string): Promise<string> {
  return bcrypt.hash(raw, SALT_ROUNDS);
}

/******************************************************************************************************************
 * Generates a deterministic HMAC-SHA256 hash of a string using a secret.
 *
 * @param value - The raw input string (e.g. refresh token)
 * @returns A hex-encoded HMAC digest that can be indexed and stored
 *
 * Usage:
 * const hash = hmacHash('my_refresh_token');
 *
 * Use Case:
 * - Refresh token hashing (unlike bcrypt, HMAC is deterministic and indexable)
 ******************************************************************************************************************/
export function hmacHash(value: string): string {
  return crypto
    .createHmac('sha256', REFRESH_TOKEN_SECRET)
    .update(value)
    .digest('hex');
}

/******************************************************************************************************************
 * Compares a raw input against a hashed string using bcrypt.
 *
 * @param raw - The plaintext input provided for comparison
 * @param hash - The hashed value to validate against
 * @returns A promise that resolves to true if they match, false otherwise
 *
 * Usage:
 * const isValid = await compareHash(inputPassword, storedHash);
 *
 * Used for:
 * - Login password verification
 * - Refresh token validation
 ******************************************************************************************************************/
export async function compareHash(raw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(raw, hash);
}

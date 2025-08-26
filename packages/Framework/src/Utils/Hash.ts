import bcrypt from 'bcryptjs';
import crypto from 'crypto';
const SALT_ROUNDS: number = Number(process.env.SALT_ROUNDS);
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

/******************************************************************************************************************
 * Hashes a string value using bcrypt with the configured salt rounds.
 * Used for:
 * - password hashing
 *
 * @param value - value to hash
 * 
 * @returns string - bcrypt hash of the provided value
 * 
 * @throws {Error} if hashing fails
 ******************************************************************************************************************/
export async function hashValue(raw: string): Promise<string> {
  return bcrypt.hash(raw, SALT_ROUNDS);
}

/******************************************************************************************************************
 * Creates an HMAC-SHA256 hash of a value using the REFRESH_TOKEN_SECRET.
 * Used for:
 * - refresh token hashing (unlike bcrypt, HMAC is deterministic and indexable)
 * 
 * @param value - raw input string to hash (e.g. refresh token)
 * 
 * @returns string - HMAC-SHA256 hash string
 * 
 * @throws {Error} if hashing fails
 ******************************************************************************************************************/
export function hmacHash(value: string): string {
  return crypto
    .createHmac('sha256', REFRESH_TOKEN_SECRET)
    .update(value)
    .digest('hex');
}

/******************************************************************************************************************
 * Compares a raw input against a hashed string using bcrypt.
 * Used for:
 * - login password verification
 * - refresh token validation
 *
 * @param value - plaintext value to check
 * @param hash - existing bcrypt hash
 * 
 * @returns bool - true if the value matches the hash
 * 
 * @throws {Error} if comparison fails
 ******************************************************************************************************************/
export async function compareHash(raw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(raw, hash);
}

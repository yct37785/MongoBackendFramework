import dotenv from 'dotenv';
import { REQUIRED_ENV_VARS } from '../consts';

/**
 * Validates required environment variables:
 * - All must be defined
 * - All string values must be non-empty
 * - All number values must be valid numbers
 *
 * Throws an error if any check fails.
 */
export function validateEnv(): void {
  const missingOrInvalid: string[] = [];

  for (const [key, type] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key];

    if (typeof value === 'undefined') {
      missingOrInvalid.push(`${key} is missing`);
    } else if (type === 'string' && value.trim() === '') {
      missingOrInvalid.push(`${key} must not be empty`);
    } else if (type === 'number' && isNaN(Number(value))) {
      missingOrInvalid.push(`${key} must be a valid number`);
    }
  }

  if (missingOrInvalid.length > 0) {
    console.error('❌ Invalid or missing environment variables:\n' + missingOrInvalid.join('\n'));
    process.exit(1);
  }
}

/**
 * load .env vars:
 * - call at top level of client index.ts
 */
export function loadEnv(path = '.env') {
  dotenv.config({ path, quiet: true });
}

import dotenv from 'dotenv';
import { REQUIRED_ENV_VARS } from '../consts';

/******************************************************************************************************************
 * Validates required environment variables:
 * - must be defined
 * - string values must be non-empty
 * - number values must be valid numbers
 * 
 * @throws {Error} if any environment variable is missing or invalid
 ******************************************************************************************************************/
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

/******************************************************************************************************************
 * Loads environment variables from a `.env` file.
 *
 * @param path - path to the .env file
 ******************************************************************************************************************/
export function loadEnv(path = '.env') {
  dotenv.config({ path, quiet: true });
}

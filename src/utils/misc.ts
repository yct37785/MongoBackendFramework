import { REQUIRED_ENV_VARS } from '../consts';

/**
 * Validates required environment variables are present.
 * Throws an error and exits if any are missing.
 */
export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.log(`❌ Missing required environment variables:\n- ${missing.join('\n- ')}`);
    process.exit(1);
  }
}
/******************************************************************************************************************
 * common values
 ******************************************************************************************************************/
export const REQUIRED_ENV_VARS: Record<string, 'string' | 'number'> = {
  PORT: 'number',
  FRONTEND_ORIGIN: 'string',
  MONGO_URI: 'string',
  MONGO_DB_NAME: 'string',
  MAX_SESSIONS: 'number',
  SALT_ROUNDS: 'number',
  ACCESS_TOKEN_EXPIRES_IN_S: 'number',
  REFRESH_TOKEN_EXPIRES_IN_S: 'number',
  ACCESS_TOKEN_SECRET: 'string',
  REFRESH_TOKEN_SECRET: 'string',
};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_MIN_LEN = 5;
export const EMAIL_MAX_LEN = 50;

export const PW_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).+$/;
export const PW_MIN_LEN = 8;
export const PW_MAX_LEN = 30;

export const TITLE_MIN_LEN = 1;
export const TITLE_MAX_LEN = 100;

export const DESC_MAX_LEN = 500;

export const SPRINT_COLS_MAX = 10;

export const REFRESH_TOKEN_LEN = 96;
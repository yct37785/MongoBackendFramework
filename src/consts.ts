/******************************************************************************************************************
 * common values
 ******************************************************************************************************************/
export const REQUIRED_ENV_VARS = [
  'PORT',
  'FRONTEND_ORIGIN',
  'MONGO_URI',
  'MONGO_DB_NAME',
  'MAX_SESSIONS',
  'SALT_ROUNDS',
  'ACCESS_TOKEN_EXPIRES_IN_S',
  'REFRESH_TOKEN_EXPIRES_IN_S',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
];

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
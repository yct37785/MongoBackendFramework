import { Types } from 'mongoose';
import { InputError } from '../error/AppError';
import {
  EMAIL_REGEX, EMAIL_MIN_LEN, EMAIL_MAX_LEN,
  PW_POLICY, PW_MIN_LEN, PW_MAX_LEN,
  TITLE_MIN_LEN, TITLE_MAX_LEN,
  DESC_MAX_LEN, SPRINT_COLS_MAX
} from '../consts';
const pwErrMsg = `password must be ${PW_MIN_LEN}-${PW_MAX_LEN} chars with uppercase, lowercase, and special`;

/******************************************************************************************************************
 * string fields
 ******************************************************************************************************************/
export function sanitizeEmail(input: unknown): string {
  if (typeof input !== 'string') throw new InputError('email');
  const email = input.trim().toLowerCase();
  if (
    email.length < EMAIL_MIN_LEN ||
    email.length > EMAIL_MAX_LEN ||
    !EMAIL_REGEX.test(email)
  ) {
    throw new InputError('email');
  }
  return email;
}

export function sanitizePassword(input: unknown): string {
  if (typeof input !== 'string') throw new InputError(pwErrMsg);
  const password = input;
  if (
    password.length < PW_MIN_LEN ||
    password.length > PW_MAX_LEN ||
    !PW_POLICY.test(password)
  ) {
    throw new InputError(pwErrMsg);
  }
  return password;
}

function sanitizeStringField(input: unknown, fieldName: string, minLen: number, maxLen: number): string {
  if (typeof input !== 'string') throw new InputError(fieldName);
  const str = input.trim();
  if (str.length < minLen || str.length > maxLen) {
    throw new InputError(`${fieldName} must be ${minLen}-${maxLen} characters`);
  }
  return str;
}

export function sanitizeTitle(input: unknown): string {
  return sanitizeStringField(input, 'title', TITLE_MIN_LEN, TITLE_MAX_LEN);
}

export function sanitizeDesc(input: unknown): string {
  return sanitizeStringField(input, 'desc', 0, DESC_MAX_LEN);
}

/******************************************************************************************************************
 * datestring fields
 ******************************************************************************************************************/
function datestrToDate(input: unknown, fieldName: string): Date {
  if (typeof input !== 'string') throw new InputError(fieldName);
  const str = input.trim();
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) {
    throw new InputError(fieldName);
  }
  return parsed;
}

export function sanitizeTargetCompletionDate(input: unknown): Date {
  return datestrToDate(input, 'targetCompletionDate');
}

/******************************************************************************************************************
 * string array fields
 ******************************************************************************************************************/
export function cleanStringArray(input: unknown[], max: number, minLen: number, maxLen: number): string[] {
  return input
    .filter((v): v is string => typeof v === 'string')
    .map(str => str.trim())
    .filter(str => str.length >= minLen && str.length <= maxLen)
    .slice(0, max);
}

export function sanitizeDefaultSprintColumns(input: unknown): string[] {
  if (!Array.isArray(input)) throw new InputError('defaultSprintColumns');
  const trimmed = cleanStringArray(input, SPRINT_COLS_MAX, TITLE_MIN_LEN, TITLE_MAX_LEN);
  return trimmed;
}

/******************************************************************************************************************
 * sanitize objectId
 ******************************************************************************************************************/
export function sanitizeObjectId(input: unknown): Types.ObjectId {
  if (typeof input !== 'string') throw new InputError('ID given');
  const idStr = input.trim();
  if (!Types.ObjectId.isValid(idStr)) {
    throw new InputError('ID given');
  }
  return new Types.ObjectId(idStr);
}

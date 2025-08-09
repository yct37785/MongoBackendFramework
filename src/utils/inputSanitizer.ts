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
 * Sanitizes an email string by trimming and lowercasing.
 *
 * @param email - raw email input
 * 
 * @returns string - sanitized email
 * 
 * @throws {InputError} if email is invalid
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

/******************************************************************************************************************
 * Sanitizes a password string by trimming.
 *
 * @param password - raw password input
 * 
 * @returns string - sanitized password
 * 
 * @throws {InputError} if password is invalid
 ******************************************************************************************************************/
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

/******************************************************************************************************************
 * Utility function to sanitize a string field.
 *
 * @param input - raw input
 * @param fieldName - field name for error logging
 * @param minLen - min length
 * @param maxLen - max length
 * 
 * @returns string - sanitized string
 * 
 * @throws {InputError} if string is invalid
 ******************************************************************************************************************/
function sanitizeStringField(input: unknown, fieldName: string, minLen: number, maxLen: number): string {
  if (typeof input !== 'string') throw new InputError(fieldName);
  const str = input.trim();
  if (str.length < minLen || str.length > maxLen) {
    throw new InputError(`${fieldName} must be ${minLen}-${maxLen} characters`);
  }
  return str;
}

/******************************************************************************************************************
 * @refer sanitizeStringField
 ******************************************************************************************************************/
export function sanitizeTitle(input: unknown): string {
  return sanitizeStringField(input, 'title', TITLE_MIN_LEN, TITLE_MAX_LEN);
}

/******************************************************************************************************************
 * @refer sanitizeStringField
 ******************************************************************************************************************/
export function sanitizeDesc(input: unknown): string {
  return sanitizeStringField(input, 'desc', 0, DESC_MAX_LEN);
}

/******************************************************************************************************************
 * Utility function to sanitize ISO datestring to JS Date obj.
 *
 * @param input - raw input
 * @param fieldName - field name for error logging
 * 
 * @returns Date - JS Date obj
 * 
 * @throws {InputError} if type or format is invalid
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

/******************************************************************************************************************
 * @refer datestrToDate
 ******************************************************************************************************************/
export function sanitizeTargetCompletionDate(input: unknown): Date {
  return datestrToDate(input, 'targetCompletionDate');
}

/******************************************************************************************************************
 * TODO: throw err instead.
 * Utility function to sanitize an array of strings.
 * Filters out string elems that does not conform to the length requirements.
 * Slices extra elems.
 *
 * @param input - raw input
 * @param max - max elems
 * @param minLen - min length of each str elem
 * @param maxLen - max length of each str elem
 * 
 * @returns string[] - sanitized string array
 ******************************************************************************************************************/
export function cleanStringArray(input: unknown[], max: number, minLen: number, maxLen: number): string[] {
  return input
    .filter((v): v is string => typeof v === 'string')
    .map(str => str.trim())
    .filter(str => str.length >= minLen && str.length <= maxLen)
    .slice(0, max);
}

/******************************************************************************************************************
 * Sanitize default sprint columns input.
 *
 * @param input - raw input
 * 
 * @returns string[] - sanitized string array
 * 
 * @throws {InputError} if type is invalid
 ******************************************************************************************************************/
export function sanitizeDefaultSprintColumns(input: unknown): string[] {
  if (!Array.isArray(input)) throw new InputError('defaultSprintColumns');
  const trimmed = cleanStringArray(input, SPRINT_COLS_MAX, TITLE_MIN_LEN, TITLE_MAX_LEN);
  return trimmed;
}

/******************************************************************************************************************
 * Sanitizes an ObjectId string.
 *
 * @param id - input representing a MongoDB ObjectId
 * 
 * @returns ObjectId - valid Mongoose ObjectId
 * 
 * @throws {InputError} if type or format is invalid
 ******************************************************************************************************************/
export function sanitizeObjectId(input: unknown): Types.ObjectId {
  if (typeof input !== 'string') throw new InputError('ID given');
  const idStr = input.trim();
  if (!Types.ObjectId.isValid(idStr)) {
    throw new InputError('ID given');
  }
  return new Types.ObjectId(idStr);
}

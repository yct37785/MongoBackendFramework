import { Types } from 'mongoose';
import { InputError } from '../Error/AppError';
import {
  EMAIL_REGEX, EMAIL_MIN_LEN, EMAIL_MAX_LEN,
  PW_POLICY, PW_MIN_LEN, PW_MAX_LEN
} from '../Consts';
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
 * @param minLen - min length
 * @param maxLen - max length
 * @param fieldName? - field name for error logging
 * 
 * @returns string - sanitized string
 * 
 * @throws {InputError} if string is invalid
 ******************************************************************************************************************/
export function sanitizeStringField(input: unknown, minLen: number, maxLen: number, fieldName?: string): string {
  if (typeof input !== 'string') throw new InputError(fieldName || '');
  const str = input.trim();
  if (str.length < minLen || str.length > maxLen) {
    throw new InputError(`${fieldName} must be ${minLen}-${maxLen} characters`);
  }
  return str;
}

/******************************************************************************************************************
 * Utility function to sanitize ISO datestring to JS Date obj.
 *
 * @param input - raw input
 * @param fieldName? - field name for error logging
 * 
 * @returns Date - JS Date obj
 * 
 * @throws {InputError} if type or format is invalid
 ******************************************************************************************************************/
export function datestrToDate(input: unknown, fieldName?: string): Date {
  if (typeof input !== 'string') throw new InputError(fieldName || '');
  const str = input.trim();
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) {
    throw new InputError(fieldName || '');
  }
  return parsed;
}

/******************************************************************************************************************
 * Utility function to validate an array of strings.
 * Requirements:
 * - input must be an array of strings
 * - string elems must meet length validation
 * - array cannot exceed max allowed elems
 *
 * @param input - raw input
 * @param max - max elems
 * @param minLen - min length of each str elem
 * @param maxLen - max length of each str elem
 * @param fieldName? - field name for error logging
 * 
 * @returns Sanitized string array
 * 
 * @throws {InputError} if above requirements not met
 ******************************************************************************************************************/
export function sanitizeStringArray(input: unknown, max: number, minLen: number, maxLen: number, fieldName?: string): string[] {
  if (!Array.isArray(input)) {
    throw new InputError(`${fieldName} expected an array of strings`);
  }
  // check for non-string elements
  if (!input.every(v => typeof v === 'string')) {
    throw new InputError(`${fieldName} all elements must be strings`);
  }
  // trim strings
  const trimmed = input.map(str => str.trim());
  // check length constraints
   for (const str of trimmed) {
    if (str.length < minLen || str.length > maxLen) {
      throw new InputError(
        `${fieldName} each string must be between ${minLen} and ${maxLen} characters`
      );
    }
  }
  // enforce element count limit
  if (trimmed.length > max) {
    throw new InputError(`${fieldName} array cannot have more than ${max} elements`);
  }
  return trimmed;
}

/******************************************************************************************************************
 * Sanitizes an ObjectId string.
 *
 * @param id - input representing a MongoDB ObjectId
 * @param fieldName? - field name for error logging
 * 
 * @returns ObjectId - valid Mongoose ObjectId
 * 
 * @throws {InputError} if type or format is invalid
 ******************************************************************************************************************/
export function sanitizeObjectId(input: unknown, fieldName?: string): Types.ObjectId {
  if (typeof input !== 'string') throw new InputError(fieldName || '');
  const idStr = input.trim();
  if (!Types.ObjectId.isValid(idStr)) {
    throw new InputError(fieldName || '');
  }
  return new Types.ObjectId(idStr);
}

/******************************************************************************************************************
 * Ensure ObjectId is defined. For use with Express userId.
 *
 * @param input - MongoDB ObjectId that might be undefined
 * 
 * @returns ObjectId - defined Mongoose ObjectId
 * 
 * @throws {InputError} if undefined
 ******************************************************************************************************************/
export function verifyObjectId(input: Types.ObjectId | undefined): Types.ObjectId {
   if (input instanceof Types.ObjectId) {
    return input;
  }
  throw new InputError('Undefined object id');
}

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
 * @return - sanitized email
 * 
 * @throws {InputError} when the email is missing or fails format/length checks
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
 * Validates a password against policy and returns the trimmed value.
 *
 * @param input - raw password input
 *
 * @return - validated password (unchanged characters; trimmed if policy allows)
 *
 * @throws {InputError} when password is missing or violates policy (length/charset/etc.)
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
 * Sanitize a string field with given parameters.
 *
 * @param input - raw input
 * @param minLen - min length
 * @param maxLen - max length
 * @param fieldName? - field name for error logging
 * 
 * @return - sanitized string
 * 
 * @throws {InputError} when value is not string-coercible or violates constraints
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
 * Sanitize an ISO datestring to JS Date obj.
 *
 * @param input - raw input
 * @param fieldName? - field name for error logging
 * 
 * @return - converted JS Date obj
 * 
 * @throws {InputError} when input type or format is invalid
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
 * Validates an array of strings:
 * - input must be an array of strings
 * - string elems must meet length validation
 * - array cannot exceed max allowed elems
 *
 * @param input - raw input
 * @param max - max number of strs in input
 * @param minLen - min length of each str elem
 * @param maxLen - max length of each str elem
 * @param fieldName? - field name for error logging
 * 
 * @return - sanitized string array
 * 
 * @throws {InputError} when above requirements are not met
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
 * Sanitizes an ObjectId input:
 * - if is already of ObjectId type, return instantly
 * - else, ensure value is valid ObjectId 24-char hex string
 *
 * @param input - raw input, could be string or already an ObjectId type
 * @param fieldName? - field name for error logging
 * 
 * @return - valid Mongoose ObjectId
 * 
 * @throws {InputError} when value is not a valid ObjectId
 ******************************************************************************************************************/
export function sanitizeObjectId(input: unknown, fieldName?: string): Types.ObjectId {
  if (input instanceof Types.ObjectId) {
    return input; // already valid
  }
  if (typeof input !== 'string') throw new InputError(fieldName || '');

  const idStr = input.trim();
  if (!Types.ObjectId.isValid(idStr)) {
    throw new InputError(fieldName || '');
  }
  return new Types.ObjectId(idStr);
}

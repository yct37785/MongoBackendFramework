import { Types } from 'mongoose';
import {
  sanitizeEmail,
  sanitizePassword,
  sanitizeStringField,
  datestrToDate,
  sanitizeStringArray,
  sanitizeObjectId
} from './inputSanitizer';
import { testInvalidStringInputs } from '../test/testUtils';
import { EMAIL_MAX_LEN, PW_MAX_LEN } from '../consts';
import { InputError } from '../error/AppError';

/******************************************************************************************************************
 * sanitizeEmail
 ******************************************************************************************************************/
describe('sanitizeEmail', () => {

  test('InputError', async () => {
    // invalid email format
    expect(() => sanitizeEmail('a@.c')).toThrow(InputError);
    expect(() => sanitizeEmail('invalid')).toThrow(InputError);
    expect(() => sanitizeEmail('                    ')).toThrow(InputError);
    expect(() => sanitizeEmail('')).toThrow(InputError);
    // exceeding length validation
    expect(() => sanitizeEmail(`${'a'.repeat(EMAIL_MAX_LEN - 11)}@example.com`)).toThrow(InputError);
    // non-string values
     await testInvalidStringInputs({
      fn: sanitizeEmail,
      arity: 1,
      expectedError: InputError,
    });
  });

  test('trim and lowercase valid email', () => {
    expect(sanitizeEmail('  TEST@Example.com  ')).toBe('test@example.com');
  });
});

/******************************************************************************************************************
 * sanitizePassword
 ******************************************************************************************************************/
describe('sanitizePassword', () => {

  test('InputError', async () => {
    // failed password policy
    expect(() => sanitizePassword('Valid@3')).toThrow(InputError);
    expect(() => sanitizePassword(`Valid@123${'a'.repeat(PW_MAX_LEN - 8)}`)).toThrow(InputError);
    expect(() => sanitizePassword('Valid01234')).toThrow(InputError);
    expect(() => sanitizePassword('')).toThrow(InputError);
    // non-string values
    await testInvalidStringInputs({
      fn: sanitizePassword,
      arity: 1,
      expectedError: InputError,
    });
  });

  test('accept valid password', () => {
    const pw = 'Valid@123';
    expect(sanitizePassword(pw)).toBe(pw);
    const pw2 = 'aaaaaaaaaaaaA@';
    expect(sanitizePassword(pw2)).toBe(pw2);
  });
});

/******************************************************************************************************************
 * sanitizeStringField
 ******************************************************************************************************************/
describe('sanitizeStringField', () => {

  test('InputError', async () => {
    // too long
    expect(() => sanitizeStringField('a'.repeat(101), 0, 100, '')).toThrow(InputError);
    // too short
    expect(() => sanitizeStringField('', 1, 100, '')).toThrow(InputError);
    expect(() => sanitizeStringField('a', 2, 100, '')).toThrow(InputError);
    expect(() => sanitizeStringField('        ', 1, 100, '')).toThrow(InputError);  // trim into length 0
    // non-string values
    await testInvalidStringInputs({
      fn: (v: string) => sanitizeStringField(v, 0, 100, ''),
      arity: 1,
      expectedError: InputError,
    });
  });

  test('trim and pass valid string', () => {
    expect(sanitizeStringField('    My Desc  ', 0, 100, '')).toBe('My Desc');
    const maxLen = 'a'.repeat(100);
    expect(sanitizeStringField(maxLen + '    ', 1, 100, '')).toBe(maxLen);
  });
});

/******************************************************************************************************************
 * datestrToDate
 ******************************************************************************************************************/
describe('datestrToDate', () => {

  test('InputError', async () => {
    // non ISO datestrings
    expect(() => datestrToDate('not-a-date', '')).toThrow(InputError);
    // non-string values
    await testInvalidStringInputs({
      fn: (v) => datestrToDate(v, ''),
      arity: 1,
      expectedError: InputError,
    });
  });

  test('return JS Date object from valid ISO datestring', () => {
    const date = new Date().toISOString();
    expect(datestrToDate(date, '')).toBeInstanceOf(Date);
    const date2 = new Date().toISOString();
    expect(datestrToDate(' ' + date2 + '  ', '')).toBeInstanceOf(Date);
  });
});

/******************************************************************************************************************
 * sanitizeStringArray
 ******************************************************************************************************************/
describe('sanitizeStringArray', () => {
  const MIN_LEN = 1;
  const MAX_LEN = 100;
  const MAX_ELEMS = 10;

  const callSanitizeStringArray = (input: unknown) =>
    sanitizeStringArray(input, MAX_ELEMS, MIN_LEN, MAX_LEN);

  test('InputError', () => {
    // post-trim string elem fails length validation
    const validInput = [' col1  ', 'col2', 'a'.repeat(MAX_LEN)];
    const input = validInput.concat(['a'.repeat(MAX_LEN + 1)]);
    expect(() => callSanitizeStringArray(input)).toThrow(InputError);

    expect(() => callSanitizeStringArray(validInput.concat(['']))).toThrow(InputError);

    expect(() => callSanitizeStringArray(validInput.concat(['        ']))).toThrow(InputError);

    // invalid elem types
    expect(() => callSanitizeStringArray([23])).toThrow(InputError);
    expect(() => callSanitizeStringArray([null])).toThrow(InputError);
    expect(() => callSanitizeStringArray([undefined])).toThrow(InputError);
    expect(() => callSanitizeStringArray(['mixed', ' test 1  ', null, undefined])).toThrow(InputError);

    // elem count exceeds
    expect(() => callSanitizeStringArray(
      Array(MAX_ELEMS + 1).fill(['abc']).flat()
    )).toThrow(InputError);

    // input type is not an array
    expect(() => callSanitizeStringArray(23)).toThrow(InputError);
    expect(() => callSanitizeStringArray({})).toThrow(InputError);
    expect(() => callSanitizeStringArray(null)).toThrow(InputError);
    expect(() => callSanitizeStringArray(undefined)).toThrow(InputError);
    expect(() => callSanitizeStringArray('["sadsad", "sdfsd"]')).toThrow(InputError);
  });

  test('valid input', () => {
    // trims trailing whitespaces for each elems
    const maxLen = 'a'.repeat(MAX_LEN);
    const result = callSanitizeStringArray(['mixed', ' test 1  ', 'test 2 ', '    ' + maxLen + '      ']);
    expect(result).toEqual(['mixed', 'test 1', 'test 2', maxLen]);
    // empty array is also valid
    expect(callSanitizeStringArray([])).toEqual([]);
  });
});

/******************************************************************************************************************
 * sanitizeObjectId
 ******************************************************************************************************************/
describe('sanitizeObjectId', () => {

  test('InputError', async () => {
    // invalid ObjectID format
    expect(() => sanitizeObjectId('123')).toThrow(InputError);
    expect(() => sanitizeObjectId('zzzzzzzzzzzzzzzzzzzzzzzz')).toThrow(InputError);
    expect(() => sanitizeObjectId('')).toThrow(InputError);
    expect(() => sanitizeObjectId(' '.repeat(24))).toThrow(InputError);
    // non-string values
    await testInvalidStringInputs({
      fn: sanitizeObjectId,
      arity: 1,
      expectedError: InputError,
    });
  });

  test('return ObjectId instance from valid string', () => {
    const validId = new Types.ObjectId().toString();
    const result = sanitizeObjectId(validId);
    expect(result).toBeInstanceOf(Types.ObjectId);
    expect(result.toString()).toBe(validId);
    // with trailing whitespaces
    const validId2 = new Types.ObjectId().toString();
    const result2 = sanitizeObjectId(`   ${validId2}   `);
    expect(result2.toString()).toBe(validId2);
  });
});

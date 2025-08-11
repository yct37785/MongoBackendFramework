import { Types } from 'mongoose';
import {
  sanitizeEmail,
  sanitizePassword,
  sanitizeStringField,
  sanitizeTargetCompletionDate,
  sanitizeDefaultSprintColumns,
  sanitizeObjectId
} from './inputSanitizer';
import { testInvalidStringInputs } from '../test/testUtils';
import { EMAIL_MAX_LEN, PW_MAX_LEN, TITLE_MIN_LEN, TITLE_MAX_LEN, DESC_MAX_LEN, SPRINT_COLS_MAX } from '../consts';
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

  test('should trim and lowercase valid email', () => {
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

  test('should accept valid password', () => {
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

  test('should trim and pass valid string', () => {
    expect(sanitizeStringField('    My Desc  ', 0, 100, '')).toBe('My Desc');
    const maxLen = 'a'.repeat(100);
    expect(sanitizeStringField(maxLen + '    ', 1, 100, '')).toBe(maxLen);
  });
});

/******************************************************************************************************************
 * datestrToDate by extension of:
   * - sanitizeTargetCompletionDate
 ******************************************************************************************************************/
describe('datestrToDate', () => {

  test('InputError', async () => {
    // non ISO datestrings
    expect(() => sanitizeTargetCompletionDate('not-a-date')).toThrow(InputError);
    // non-string values
    await testInvalidStringInputs({
      fn: sanitizeTargetCompletionDate,
      arity: 1,
      expectedError: InputError,
    });
  });

  test('should return JS Date object from valid ISO datestring', () => {
    const date = new Date().toISOString();
    expect(sanitizeTargetCompletionDate(date)).toBeInstanceOf(Date);
    const date2 = new Date().toISOString();
    expect(sanitizeTargetCompletionDate(' ' + date2 + '  ')).toBeInstanceOf(Date);
  });
});

/******************************************************************************************************************
 * sanitizeDefaultSprintColumns
 ******************************************************************************************************************/
describe('sanitizeDefaultSprintColumns', () => {

  test('InputError: post-trim string elem fails length validation', () => {
    // post-trim string elem fails length validation
    const validInput = [' col1  ', 'col2', 'a'.repeat(TITLE_MAX_LEN)];
    const input = validInput.concat(['a'.repeat(TITLE_MAX_LEN + 1)]);
    expect(() => sanitizeDefaultSprintColumns(input)).toThrow(InputError);

    expect(() => sanitizeDefaultSprintColumns(validInput.concat(['']))).toThrow(InputError);

    expect(() => sanitizeDefaultSprintColumns(validInput.concat(['        ']))).toThrow(InputError);

    // invalid elem types
    expect(() => sanitizeDefaultSprintColumns([23])).toThrow(InputError);
    expect(() => sanitizeDefaultSprintColumns([null])).toThrow(InputError);
    expect(() => sanitizeDefaultSprintColumns([undefined])).toThrow(InputError);
    expect(() => sanitizeDefaultSprintColumns(['mixed', ' test 1  ', null, undefined])).toThrow(InputError);

    // column count exceeds
    expect(() => sanitizeDefaultSprintColumns(
      Array(SPRINT_COLS_MAX + 1).fill(['abc']).flat()
    )).toThrow(InputError);

    // input type is not an array
    expect(() => sanitizeDefaultSprintColumns(23)).toThrow(InputError);
    expect(() => sanitizeDefaultSprintColumns({})).toThrow(InputError);
    expect(() => sanitizeDefaultSprintColumns(null)).toThrow(InputError);
    expect(() => sanitizeDefaultSprintColumns(undefined)).toThrow(InputError);
    expect(() => sanitizeDefaultSprintColumns('["sadsad", "sdfsd"]')).toThrow(InputError);
  });

  test('valid input', () => {
    // trims trailing whitespaces for each elems
    const maxLen = 'a'.repeat(TITLE_MAX_LEN);
    const result = sanitizeDefaultSprintColumns(['mixed', ' test 1  ', 'test 2 ', '    ' + maxLen + '      ']);
    expect(result).toEqual(['mixed', 'test 1', 'test 2', maxLen]);
    // empty array is also valid
    expect(sanitizeDefaultSprintColumns([])).toEqual([]);
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

  test('returns ObjectId instance from valid string', () => {
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

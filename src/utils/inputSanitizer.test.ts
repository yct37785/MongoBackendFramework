import { Types } from 'mongoose';
import {
  sanitizeEmail,
  sanitizePassword,
  sanitizeTitle,
  sanitizeDesc,
  sanitizeTargetCompletionDate,
  sanitizeDefaultSprintColumns,
  sanitizeObjectId
} from './inputSanitizer';
import { testInvalidStringInputs } from '../test/testUtils';
import { EMAIL_MAX_LEN, PW_MAX_LEN, TITLE_MIN_LEN, TITLE_MAX_LEN, DESC_MAX_LEN, SPRINT_COLS_MAX } from '../consts';
import { InputError } from '../error/AppError';

describe('inputSanitizer', () => {
  /*---------------------------------------------------------------------------------------------------------------
   * sanitizeEmail
   ---------------------------------------------------------------------------------------------------------------*/
  test('sanitizeEmail should trim and lowercase valid email', () => {
    expect(sanitizeEmail('  TEST@Example.com  ')).toBe('test@example.com');
  });

  test('sanitizeEmail should throw on empty or invalid value', () => {
    expect(() => sanitizeEmail('a@.c')).toThrow(InputError);
    expect(() => sanitizeEmail('invalid')).toThrow(InputError);
    expect(() => sanitizeEmail('                    ')).toThrow(InputError);
    expect(() => sanitizeEmail('')).toThrow(InputError);
  });  

  test('sanitizeEmail should throw on email exceeding length', () => {
    expect(() => sanitizeEmail(`${'a'.repeat(EMAIL_MAX_LEN - 11)}@example.com`)).toThrow(InputError);
    const validEmail = `${'a'.repeat(EMAIL_MAX_LEN - 12)}@example.com`;
    expect(sanitizeEmail(`     ${validEmail}      `)).toBe(`${validEmail}`);
  });

  test('sanitizeEmail should throw on non-string input types', async () => {
    await testInvalidStringInputs({
      fn: sanitizeEmail,
      arity: 1,
      expectedError: InputError,
    });
  });

  /*---------------------------------------------------------------------------------------------------------------
   * sanitizePassword
   ---------------------------------------------------------------------------------------------------------------*/
  test('sanitizePassword should accept valid password', () => {
    const pw = 'Valid@123';
    expect(sanitizePassword(pw)).toBe(pw);
  });

  test('sanitizePassword should throw on too short, long or missing requirements', () => {
    expect(() => sanitizePassword('Valid@3')).toThrow(InputError);
    expect(() => sanitizePassword(`Valid@123${'a'.repeat(PW_MAX_LEN - 8)}`)).toThrow(InputError);
    expect(() => sanitizePassword('Valid01234')).toThrow(InputError);
    expect(() => sanitizePassword('')).toThrow(InputError);
  });

  test('sanitizePassword should throw on non-string input types', async () => {
    await testInvalidStringInputs({
      fn: sanitizePassword,
      arity: 1,
      expectedError: InputError,
    });
  });

  /*---------------------------------------------------------------------------------------------------------------
   * sanitizeStringField by extension of:
   * - sanitizeTitle
   * - sanitizeDesc
   ---------------------------------------------------------------------------------------------------------------*/
  test('sanitizeStringField should trim and pass valid string', () => {
    expect(sanitizeDesc('  My Desc  ')).toBe('My Desc');
    const maxLen = 'a'.repeat(TITLE_MAX_LEN);
    expect(sanitizeTitle(maxLen + '  ')).toBe(maxLen);
  });

  test('sanitizeStringField should throw if too short or long', () => {
    // too long
    expect(() => sanitizeDesc('a'.repeat(DESC_MAX_LEN + 1))).toThrow(InputError);
    // too short
    expect(() => sanitizeTitle('a'.repeat(TITLE_MIN_LEN - 1))).toThrow(InputError);
    expect(() => sanitizeTitle('')).toThrow(InputError);
    expect(() => sanitizeTitle('        ')).toThrow(InputError);  // trim into length 0
  });

  test('sanitizeStringField should throw on non-string input types', async () => {
    await testInvalidStringInputs({
      fn: sanitizeTitle,
      arity: 1,
      expectedError: InputError,
    });
  });

  /*---------------------------------------------------------------------------------------------------------------
   * sanitizeTargetCompletionDate
   ---------------------------------------------------------------------------------------------------------------*/
  test('sanitizeTargetCompletionDate returns valid Date', () => {
    const date = new Date().toISOString();
    expect(sanitizeTargetCompletionDate(date)).toBeInstanceOf(Date);
  });

  test('sanitizeTargetCompletionDate throws on invalid date input', () => {
    expect(() => sanitizeTargetCompletionDate('not-a-date')).toThrow(InputError);
    expect(() => sanitizeTargetCompletionDate(null)).toThrow(InputError);
  });

  test('sanitizeTargetCompletionDate should throw on non-string input types', async () => {
    await testInvalidStringInputs({
      fn: sanitizeTargetCompletionDate,
      arity: 1,
      expectedError: InputError,
    });
  });

  /*---------------------------------------------------------------------------------------------------------------
   * sanitizeDefaultSprintColumns
   ---------------------------------------------------------------------------------------------------------------*/
  test('sanitizeDefaultSprintColumns passes empty array', () => {
    expect(sanitizeDefaultSprintColumns([])).toEqual([]);
  });

  test('sanitizeDefaultSprintColumns trims valid strings', () => {
    const maxLen = 'a'.repeat(TITLE_MAX_LEN);
    const result = sanitizeDefaultSprintColumns(['mixed', ' test 1  ', 'test 2 ', '    ' + maxLen + '      ']);
    expect(result).toEqual(['mixed', 'test 1', 'test 2', maxLen]);
  });

  test('sanitizeDefaultSprintColumns fails if post-trim string elem fails length validation', () => {
    const validInput = [' col1  ', 'col2', 'a'.repeat(TITLE_MAX_LEN)];
    const input = validInput.concat(['a'.repeat(TITLE_MAX_LEN + 1)]);
    expect(() => sanitizeDefaultSprintColumns(input)).toThrow(InputError);

    const input2 = validInput.concat(['']);
    expect(() => sanitizeDefaultSprintColumns(input2)).toThrow(InputError);

    const input3 = validInput.concat(['        ']);
    expect(() => sanitizeDefaultSprintColumns(input3)).toThrow(InputError);
  });

  test('sanitizeDefaultSprintColumns fails on invalid elem types', () => {
    expect(() => sanitizeDefaultSprintColumns([23])).toThrow(InputError);
    expect(() => sanitizeDefaultSprintColumns([null])).toThrow(InputError);
    expect(() => sanitizeDefaultSprintColumns([undefined])).toThrow(InputError);
    expect(() => sanitizeDefaultSprintColumns(['mixed', ' test 1  ', null, undefined])).toThrow(InputError);
  });

  test('sanitizeDefaultSprintColumns fails if column count exceeds', () => {
    const input = Array(SPRINT_COLS_MAX + 1).fill(['abc']).flat();
    expect(() => sanitizeDefaultSprintColumns(input)).toThrow(InputError);
  });

  test('sanitizeDefaultSprintColumns fails if not an array', () => {
    expect(() => sanitizeDefaultSprintColumns(23)).toThrow(InputError);
    expect(() => sanitizeDefaultSprintColumns({})).toThrow(InputError);
    expect(() => sanitizeDefaultSprintColumns(null)).toThrow(InputError);
    expect(() => sanitizeDefaultSprintColumns(undefined)).toThrow(InputError);
  });

  /*---------------------------------------------------------------------------------------------------------------
   * sanitizeObjectId
   ---------------------------------------------------------------------------------------------------------------*/
  test('sanitizeObjectId throws ObjectId instance from valid string', () => {
    const validId = new Types.ObjectId().toString();
    const result = sanitizeObjectId(validId);
    expect(result).toBeInstanceOf(Types.ObjectId);
    expect(result.toString()).toBe(validId);
  });

  test('sanitizeObjectId throws whitespace from input and return ObjectId', () => {
    const id = new Types.ObjectId().toString();
    const result = sanitizeObjectId(`   ${id}   `);
    expect(result.toString()).toBe(id);
  });

  test('sanitizeObjectId throws on invalid ObjectId string', () => {
    expect(() => sanitizeObjectId('123')).toThrow(InputError);
    expect(() => sanitizeObjectId('zzzzzzzzzzzzzzzzzzzzzzzz')).toThrow(InputError);
    expect(() => sanitizeObjectId('')).toThrow(InputError);
    expect(() => sanitizeObjectId(' '.repeat(24))).toThrow(InputError);
  });

  test('sanitizeObjectId should throw on non-string input types', async () => {
    await testInvalidStringInputs({
      fn: sanitizeObjectId,
      arity: 1,
      expectedError: InputError,
    });
  });
});

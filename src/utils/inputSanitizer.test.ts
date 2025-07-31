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
import { testInvalidStringInputs } from './testUtils';
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
   * sanitizeTitle and sanitizeDesc
   ---------------------------------------------------------------------------------------------------------------*/
  test('sanitizeTitle should trim and pass valid title', () => {
    expect(sanitizeTitle('  My Title  ')).toBe('My Title');
  });

  test('sanitizeTitle should throw if too short or long', () => {
    expect(() => sanitizeTitle('')).toThrow(InputError);
    expect(() => sanitizeTitle('a'.repeat(TITLE_MIN_LEN - 1))).toThrow(InputError);
    expect(() => sanitizeTitle('a'.repeat(TITLE_MAX_LEN + 1))).toThrow(InputError);
    expect(() => sanitizeTitle('        ')).toThrow(InputError);  // trim into length 0
  });

  test('sanitizeTitle should throw on non-string input types', async () => {
    await testInvalidStringInputs({
      fn: sanitizeTitle,
      arity: 1,
      expectedError: InputError,
    });
  });

  test('sanitizeDesc allows empty string and trims', () => {
    expect(sanitizeDesc('    ')).toBe('');
    expect(sanitizeDesc('  Some Description   ')).toBe('Some Description');
  });

  test('sanitizeDesc throws if exceeds max length', () => {
    expect(() => sanitizeDesc('a'.repeat(DESC_MAX_LEN + 1))).toThrow(InputError);
  });

  test('sanitizeDesc should throw on non-string input types', async () => {
    await testInvalidStringInputs({
      fn: sanitizeDesc,
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
  test('sanitizeDefaultSprintColumns trims and filters valid strings', () => {
    const input = [' col1  ', 'col2', '', 'a'.repeat(TITLE_MAX_LEN), 'a'.repeat(TITLE_MAX_LEN + 10)];
    const result = sanitizeDefaultSprintColumns(input);
    expect(result).toEqual(['col1', 'col2', 'a'.repeat(TITLE_MAX_LEN)]);
    const result2 = sanitizeDefaultSprintColumns(['', '', '']);
    expect(result2).toEqual([]);
    const result3 = sanitizeDefaultSprintColumns(['', '', 23, null, undefined]);
    expect(result3).toEqual([]);
    const result4 = sanitizeDefaultSprintColumns(['', '', 'mixed', ' test 1  ', null, undefined]);
    expect(result4).toEqual(['mixed', 'test 1']);
    const result5 = sanitizeDefaultSprintColumns([]);
    expect(result5).toEqual([]);
  });

  test('sanitizeDefaultSprintColumns trims if columns exceeds', () => {
    const input = Array(SPRINT_COLS_MAX + 1).fill(['abc']).flat();
    const result = sanitizeDefaultSprintColumns(input);
    expect(result).toEqual(Array(SPRINT_COLS_MAX).fill(['abc']).flat());
  });

  test('sanitizeDefaultSprintColumns throws if not an array', () => {
    expect(() => sanitizeDefaultSprintColumns(23)).toThrow(InputError);
    expect(() => sanitizeDefaultSprintColumns({})).toThrow(InputError);
  });

  test('sanitizeDefaultSprintColumns filters out invalid mixed types', () => {
    const input = ['valid', 123, {}, [], null, '  trimmed  ', undefined];
    const result = sanitizeDefaultSprintColumns(input as any[]);
    expect(result).toEqual(['valid', 'trimmed']);
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

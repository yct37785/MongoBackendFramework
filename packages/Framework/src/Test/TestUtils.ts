import type { Request } from 'express';
import mongoose, { Types } from 'mongoose';
import { EMAIL_MAX_LEN, PW_MAX_LEN } from '../Consts';

/******************************************************************************************************************
 * Invalid values.
 ******************************************************************************************************************/
export const invaid_strs = [null, undefined, 123, true, [], {}, Symbol('sym')];
export const invalid_emails = [`${'a'.repeat(EMAIL_MAX_LEN - 11)}@example.com`, '     ', '', 'plainaddress',
  '@missinguser.com', 'user@.com', 'user@site..com', 'user@site.c'];
export const invalid_pws = [`Valid@123${'a'.repeat(PW_MAX_LEN - 8)}`, '     ', '', 'Valid@3',
  'Valid01234', 'Valid01234'];

/******************************************************************************************************************
 * Waits for a number of seconds before resolving.
 *
 * @param s - number of seconds to wait
 * @returns Promise - promise that resolves after the delay
 ******************************************************************************************************************/
export const wait = (s: number) => new Promise(res => setTimeout(res, s * 1000));

/******************************************************************************************************************
 * Generic invalid value tester.
 *
 * @param fn - function under test (accepts one value)
 * @param values - array of invalid values to test
 * @param expectedError - error class expected to be thrown
 ******************************************************************************************************************/
export async function testInvalidInputs(
  fn: (v: any) => any,
  values: any[],
  expectedError: new (...args: any[]) => Error = Error
) {
  for (const val of values) {
    const result = (() => fn(val)) as any;

    if (result instanceof Promise) {
      // async function: expect rejection
      await expect(result).rejects.toThrow(expectedError);
    } else {
      // sync function: expect throw
      expect(() => fn(val)).toThrow(expectedError);
    }
  }
}

/******************************************************************************************************************
 * Creates a mock Express Request for controller/middleware tests.
 * Simulates a minimal Express request object with optional `headers`, `query`, `params`, `ip`, and `user` fields.
 * Useful for testing controllers or middleware without requiring a full Express context.
 *
 * @param body? - value for `req.body`
 * @param userId? - sets `req.user = { userId, email: '' }`
 * @param params? - value for `req.params`
 * @param query? - value for `req.query`
 *
 * @returns any - mock request shaped like Express `Request`
 ******************************************************************************************************************/
export function mockReq(
  body?: Record<string, any>,
  userId?: Types.ObjectId,
  params?: Record<string, any>,
  query?: Record<string, any>
): Request {
  const req: Partial<Request> = {
    body,
    headers: { 'user-agent': 'jest-test-agent' }
  };
  if (userId) req.user = { userId, email: '' };
  if (params) req.params = params;
  if (query) req.query = query;
  return req as Request;
}

/******************************************************************************************************************
 * Asserts that a value is a Mongoose document/model instance.
 *
 * @param value - value to check
 ******************************************************************************************************************/
export function expectMongooseDoc(value: unknown) {
  expect(value).toBeInstanceOf(mongoose.Model);
}

/******************************************************************************************************************
 * Asserts that a value is a plain object (not a Mongoose document).
 *
 * @param value - value to check
 ******************************************************************************************************************/
export function expectObj(value: unknown) {
  expect(value?.constructor.name).toBe('Object');
}

/******************************************************************************************************************
 * Asserts that a value is a string.
 *
 * @param value - value to check
 ******************************************************************************************************************/
export function expectString(value: unknown) {
  expect(typeof value === 'string').toBeTruthy();
}

/******************************************************************************************************************
 * Asserts that a value is a JS Date instance.
 *
 * @param value - value to check
 ******************************************************************************************************************/
export function expectDate(value: unknown) {
  expect(value).toBeInstanceOf(Date);
}

/******************************************************************************************************************
 * Asserts that a string is a valid Mongoose objectId.
 *
 * @param value - value to check
 ******************************************************************************************************************/
export function expectObjectIdStr(value: string) {
  expect(value).toMatch(/^[a-f\d]{24}$/i);
}

/******************************************************************************************************************
 * Common testing placeholder values.
 ******************************************************************************************************************/
export function genTestEmail(): string {
  const rand = Math.random().toString(36).slice(2, 10); // 8 random chars
  return `user${rand}@test.com`;
}
export const TEST_PW = 'StrongP@ss123!';
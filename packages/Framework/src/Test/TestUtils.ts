import type { Request } from 'express';
import mongoose, { Types } from 'mongoose';
import { EMAIL_MAX_LEN, PW_MAX_LEN } from '../Consts';

export const invalidStrs = [null, undefined, 123, true, [], {}, Symbol('sym')];
export const invalidEmailValues = [`${'a'.repeat(EMAIL_MAX_LEN - 11)}@example.com`, '     ', '', 'plainaddress',
  '@missinguser.com', 'user@.com', 'user@site..com', 'user@site.c'];
export const invalidPwValues = [`Valid@123${'a'.repeat(PW_MAX_LEN - 8)}`, '     ', '', 'Valid@3',
  'Valid01234', 'Valid01234'];

/******************************************************************************************************************
 * Waits for a number of seconds before resolving.
 *
 * @param s - number of seconds to wait
 * @returns Promise - promise that resolves after the delay
 ******************************************************************************************************************/
export const wait = (s: number) => new Promise(res => setTimeout(res, s * 1000));

/******************************************************************************************************************
 * Generic invalid value tester
 *
 * Dynamically verifies that a function rejects a set of invalid values for each parameter position.
 *
 * @param config - options object:
 *   - fn: function under test
 *   - arity: number of parameters
 *   - values: array of invalid values to test (e.g. invalidStrValues, invalidEmailValues)
 *   - fixedArgs?: default arguments for non-tested positions
 *   - expectedError?: error class expected to be thrown
 ******************************************************************************************************************/
export async function testInvalidInputs({
  fn,
  arity,
  values,
  fixedArgs = [],
  expectedError = Error,
}: {
  fn: (...args: any[]) => any;
  arity: number;
  values: any[];
  fixedArgs?: any[];
  expectedError?: new (...args: any[]) => Error;
}) {
  for (let paramIndex = 0; paramIndex < arity; paramIndex++) {
    for (const val of values) {
      const args = Array.from({ length: arity }).map((_, i) =>
        fixedArgs[i] !== undefined
          ? fixedArgs[i]
          : i === paramIndex
          ? val
          : 'valid'
      );

      try {
        const result = fn(...args);

        if (result instanceof Promise) {
          await expect(result).rejects.toThrow(expectedError);
        } else {
          expect(() => fn(...args)).toThrow(expectedError);
        }
      } catch (err) {
        expect(err).toBeInstanceOf(expectedError);
      }
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
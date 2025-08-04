import type { Request } from 'express';
import mongoose, { Types } from 'mongoose';

/******************************************************************************************************************
 * misc utilities
 ******************************************************************************************************************/
export const wait = (s: number) => new Promise(res => setTimeout(res, s * 1000));

/******************************************************************************************************************
 * Dynamically test invalid non-string inputs for each argument of a function.
 *
 * @param fn - The function to test
 * @param arity - Number of parameters the function expects
 * @param fixedArgs - Fixed values for non-targeted parameters
 * @param expectedError - The error class expected to be thrown
 ******************************************************************************************************************/
export async function testInvalidStringInputs({
  fn,
  arity,
  fixedArgs = [],
  expectedError = Error,
}: {
  fn: (...args: any[]) => any;
  arity: number;
  fixedArgs?: any[];
  expectedError?: new (...args: any[]) => Error;
}) {
  const invalidValues = [null, undefined, 123, true, [], {}, Symbol('sym')];

  for (let paramIndex = 0; paramIndex < arity; paramIndex++) {
    for (const invalid of invalidValues) {
      const args = Array.from({ length: arity }).map((_, i) =>
        fixedArgs[i] !== undefined
          ? fixedArgs[i]
          : i === paramIndex
          ? invalid
          : 'valid'
      );

      try {
        const result = fn(...args);
        if (result instanceof Promise) {
          await expect(result).rejects.toThrow(expectedError);
        } else {
          // if no error thrown yet, throw to fail test
          fail(`Expected fn(${args}) to throw synchronously, but it returned: ${result}`);
        }
      } catch (err) {
        // expected sync throw
        expect(() => fn(...args)).toThrow(expectedError);
      }
    }
  }
}

/******************************************************************************************************************
 * mockReq - Utility to create a mock Express Request object for unit testing.
 *
 * Simulates a minimal Express request object with optional `headers`, `query`, `params`, `ip`, and `user` fields.
 * Useful for testing controllers or middleware without requiring a full Express context.
 *
 * @param body - The `req.body` object.
 * @param userId - userId for mock request.
 * @param query - `req.query` object.
 * @param params - `req.params` object.
 * @returns A mock Request object typed as `Request`, suitable for unit tests.
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
 * Test for data types.
 ******************************************************************************************************************/
export function expectMongooseDoc(value: unknown) {
  expect(value).toBeInstanceOf(mongoose.Model);
}

export function expectObj(value: unknown) {
  // to strictly confirm it’s not a Mongoose doc
  expect(value?.constructor.name).toBe('Object');
}

export function expectString(value: unknown) {
  expect(typeof value === 'string').toBeTruthy();
}

export function expectDate(value: unknown) {
  expect(value).toBeInstanceOf(Date);
}
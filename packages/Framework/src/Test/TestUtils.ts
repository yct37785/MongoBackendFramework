import type { Request } from 'express';
const supRequest = require('supertest');
import mongoose, { Types } from 'mongoose';
import { EMAIL_MAX_LEN, PW_MAX_LEN } from '../Consts';

/******************************************************************************************************************
 * invalid values sets
 ******************************************************************************************************************/
export const invaid_strs = [null, undefined, 123, true, [], {}, Symbol('sym')];
export const invaid_strs_optional = [null, 123, true, [], {}, Symbol('sym')];  // for testing optional str fields (can be undefined)
export const invalid_emails = [`${'a'.repeat(EMAIL_MAX_LEN - 11)}@example.com`, '     ', '', 'plainaddress',
  '@missinguser.com', 'user@.com', 'user@site..com', 'user@site.c'];
export const invalid_pws = [`Valid@123${'a'.repeat(PW_MAX_LEN - 8)}`, '     ', '', 'Valid@3',
  'Valid01234', 'Valid01234'];
export const invalid_objIds = ['123', 'zzzzzzzzzzzzzzzzzzzzzzzz', '', ' '.repeat(24)];

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
 * @param expectedError - error class expected to be thrown
 * @param valueSets - one or more arrays of invalid values
 ******************************************************************************************************************/
export async function testInvalidInputs(
  fn: (v: any) => any,
  expectedError: new (...args: any[]) => Error = Error,
  ...valueSets: any[][]
) {
  const values = valueSets.flat();

  for (const val of values) {
    let result: any;

    try {
      result = fn(val);
    } catch (err) {
      // sync throw (happened immediately)
      expect(err).toBeInstanceOf(expectedError);
      continue; // skip to next val
    }

    if (result instanceof Promise) {
      await expect(result).rejects.toThrow(expectedError);
    } else {
      // sync function that *returned* normally (rare here)
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
  userId?: Types.ObjectId | null,
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
 * URI builder utility.
 * Substitutes params into URL and appends query strings.
 * 
 * @param path - base URL path
 * @param params? - params record
 * @param query? - query record
 * 
 * @returns string - fully built URL
 ******************************************************************************************************************/
export function buildUrl(path: string, params?: Record<string, any>, query?: Record<string, any>): string {
  let url = path;
  // substitute :params in path
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, encodeURIComponent(String(value)));
    }
  }
  // append query string
  if (query) {
    const queryString = new URLSearchParams(
      Object.entries(query).map(([k, v]) => [k, String(v)])
    ).toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }
  return url;
}

/******************************************************************************************************************
 * Endpoints utility with supertest.
 ******************************************************************************************************************/
export async function doPost(
  server: ReturnType<typeof supRequest>,
  path: string,
  body?: any,
  params?: Record<string, any>,
  query?: Record<string, any>
) {
  const url = buildUrl(path, params, query);
  let req = server.post(url).set('Accept', 'application/json');
  if (body) req = req.send(body);
  return await req;
}

export async function doGet(
  server: ReturnType<typeof supRequest>,
  path: string,
  body?: any,
  params?: Record<string, any>,
  query?: Record<string, any>
) {
  const url = buildUrl(path, params, query);
  let req = server.get(url).set('Accept', 'application/json');
  if (body) req = req.send(body);
  return await req;
}

/******************************************************************************************************************
 * Malform given token by changing last chr.
 *
 * @param token - token value to malform
 * 
 * @returns string - malformed token
 ******************************************************************************************************************/
export function malformToken(token: string) {
  return token.slice(0, -1) + (token.at(-1) === 'a' ? 'b' : 'a');
}

/******************************************************************************************************************
 * Asserts that a value matches the listed datatype.
 *
 * @param value - value to check
 ******************************************************************************************************************/
// value is a Mongoose document/model instance
export function expectMongooseDoc(value: unknown) {
  expect(value).toBeInstanceOf(mongoose.Model);
}

// value is a plain object (not a Mongoose document)
export function expectObj(value: unknown) {
  expect(value?.constructor.name).toBe('Object');
}

// value is a string
export function expectString(value: unknown) {
  expect(typeof value === 'string').toBeTruthy();
}

// value is a JS Date instance
export function expectDate(value: unknown) {
  expect(value).toBeInstanceOf(Date);
}

// string is a valid Mongoose objectId
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
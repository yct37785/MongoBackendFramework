
import { Types } from 'mongoose';
import {
  generateNewTokens,
  createRefreshTokenEntry,
  pruneAndSortRefreshTokens,
  isRefreshTokenExpired,
  removeTokenFromList
} from './TokenHelpers';
import { InternalError } from '../Error/AppError';
import { IRefreshToken } from '../Models/UserModel';
import { genTestEmail } from '../Test/TestUtils';
const ACCESS_TOKEN_EXPIRES_IN_S = Number(process.env.ACCESS_TOKEN_EXPIRES_IN_S);
const REFRESH_TOKEN_EXPIRES_IN_S = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_S);
const MAX_SESSIONS = Number(process.env.MAX_SESSIONS);

const userId = new Types.ObjectId();
const email = genTestEmail();

/******************************************************************************************************************
 * generateNewTokens
 ******************************************************************************************************************/
describe('generateNewTokens', () => {

  test('throw InternalError if userId or email is invalid', () => {
    // @ts-expect-error
    expect(() => generateNewTokens(null, email)).toThrow(InternalError);
    // @ts-expect-error
    expect(() => generateNewTokens('not-an-objectid', email)).toThrow(InternalError);
    expect(() => generateNewTokens(userId, '')).toThrow(InternalError);
    // @ts-expect-error
    expect(() => generateNewTokens(userId, null)).toThrow(InternalError);
  });

  test('return valid token pair and expiry dates', () => {
    const result = generateNewTokens(userId, email);
    expect(typeof result.accessToken).toBe('string');
    expect(typeof result.refreshToken).toBe('string');
    expect(typeof result.hashedToken).toBe('string');
    expect(result.atExpiresAt).toBeInstanceOf(Date);
    expect(result.rtExpiresAt).toBeInstanceOf(Date);
  });

  test('set expiry dates in the future', () => {
    const before = Date.now();
    const { atExpiresAt, rtExpiresAt } = generateNewTokens(userId, email);
    const after = Date.now();

    expect(atExpiresAt.getTime()).toBeGreaterThanOrEqual(before + 1000);
    expect(rtExpiresAt.getTime()).toBeGreaterThanOrEqual(before + 1000);
    expect(atExpiresAt.getTime()).toBeLessThanOrEqual(after + ACCESS_TOKEN_EXPIRES_IN_S * 1000);
    expect(rtExpiresAt.getTime()).toBeLessThanOrEqual(after + REFRESH_TOKEN_EXPIRES_IN_S * 1000);
  });
});

/******************************************************************************************************************
 * createRefreshTokenEntry
 ******************************************************************************************************************/
describe('createRefreshTokenEntry', () => {

  test('return properly structured object', () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60000);
    const entry = createRefreshTokenEntry('hashedToken123', expiresAt, 'agent', '127.0.0.1');

    expect(entry.tokenHash).toBe('hashedToken123');
    expect(entry.createdAt).toBeInstanceOf(Date);
    expect(entry.lastUsedAt).toBeInstanceOf(Date);
    expect(entry.expiresAt).toEqual(expiresAt);
    expect(entry.userAgent).toBe('agent');
    expect(entry.ip).toBe('127.0.0.1');
  });

  test('works even with missing userAgent and ip', () => {
    const expiresAt = new Date(Date.now() + 60000);
    const entry = createRefreshTokenEntry('hash123', expiresAt);

    expect(entry.tokenHash).toBe('hash123');
    expect(entry.userAgent).toBeUndefined();
    expect(entry.ip).toBeUndefined();
    expect(entry.createdAt).toBeInstanceOf(Date);
    expect(entry.lastUsedAt).toBeInstanceOf(Date);
    expect(entry.expiresAt).toEqual(expiresAt);
  }); 
});

/******************************************************************************************************************
 * pruneAndSortRefreshTokens
 ******************************************************************************************************************/
describe('pruneAndSortRefreshTokens', () => {

  test('filter by expired and enforces max sessions', () => {
    const now = new Date();
    const expired = new Date(now.getTime() - 10000);
    const valid = new Date(now.getTime() + 100000);

    // create MAX_SESSIONS + 2 valid tokens to exceed the limit
    const tokens = Array.from({ length: MAX_SESSIONS + 2 }, (_, i) => ({
      tokenHash: `valid-${i}`,
      createdAt: new Date(now.getTime() - i * 1000),
      lastUsedAt: now,
      expiresAt: valid,
    }));

    // add 1 expired token (should be filtered out regardless)
    tokens.push({
      tokenHash: 'expired',
      createdAt: new Date(now.getTime() - 999999),
      lastUsedAt: now,
      expiresAt: expired,
    });
    const result = pruneAndSortRefreshTokens(tokens);

    // expect maxSessions tokens to be retained, excluding the expired one
    expect(result.length).toBe(MAX_SESSIONS);
    // ensure the newest one is first
    expect(result[0].tokenHash).toBe('valid-0');
  });

   test('return empty array if all tokens are expired', () => {
    const now = new Date();
    const expired = new Date(now.getTime() - 10000);

    const expiredTokens = Array.from({ length: 5 }, (_, i) => ({
      tokenHash: `expired-${i}`,
      createdAt: new Date(now.getTime() - i * 1000),
      lastUsedAt: now,
      expiresAt: expired,
    }));

    const result = pruneAndSortRefreshTokens(expiredTokens);
    expect(result).toEqual([]);
  });

  test('sort by createdAt descending', () => {
    const now = new Date();
    const tokens: IRefreshToken[] = [
      { tokenHash: 'b', createdAt: new Date(now.getTime() - 1000), lastUsedAt: now, expiresAt: new Date(now.getTime() + 60000) },
      { tokenHash: 'a', createdAt: new Date(now.getTime() - 500), lastUsedAt: now, expiresAt: new Date(now.getTime() + 60000) },
      { tokenHash: 'c', createdAt: new Date(now.getTime() - 2000), lastUsedAt: now, expiresAt: new Date(now.getTime() + 60000) },
    ];

    const result = pruneAndSortRefreshTokens(tokens);
    expect(result.map(t => t.tokenHash)).toEqual(['a', 'b', 'c']);
  });
});

/******************************************************************************************************************
 * isRefreshTokenExpired
 ******************************************************************************************************************/
describe('isRefreshTokenExpired', () => {

  test('return true for expired token', () => {
    const expiredToken = { tokenHash: '', createdAt: new Date(), lastUsedAt: new Date(), expiresAt: new Date(Date.now() - 10000) };
    expect(isRefreshTokenExpired(expiredToken)).toBe(true);
  });

  test('return false for valid token', () => {
    const validToken = { tokenHash: '', createdAt: new Date(), lastUsedAt: new Date(), expiresAt: new Date(Date.now() + 10000) };
    expect(isRefreshTokenExpired(validToken)).toBe(false);
  });
});

/******************************************************************************************************************
 * removeTokenFromList
 ******************************************************************************************************************/
describe('removeTokenFromList', () => {

  test('remove token by hash', () => {
    const list: IRefreshToken[] = [
      { tokenHash: 'abc', createdAt: new Date(), lastUsedAt: new Date(), expiresAt: new Date() },
      { tokenHash: 'def', createdAt: new Date(), lastUsedAt: new Date(), expiresAt: new Date() },
    ];
    const result = removeTokenFromList(list, 'abc');
    expect(result.length).toBe(1);
    expect(result[0].tokenHash).toBe('def');
  });

  test('return same list if token not found', () => {
    const list: IRefreshToken[] = [
      { tokenHash: 'abc', createdAt: new Date(), lastUsedAt: new Date(), expiresAt: new Date() },
    ];
    const result = removeTokenFromList(list, 'nonexistent');
    expect(result.length).toBe(1);
    expect(result[0].tokenHash).toBe('abc');
  });
});

import { generateAccessToken, generateRefreshToken } from './jwt';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { InternalError } from '../error/AppError';
import { wait } from '../test/testUtils';

describe('jwt.ts', () => {
  const userId = new Types.ObjectId();
  const email = 'test@example.com';
  const atExpiresIn = Number(process.env.ACCESS_TOKEN_EXPIRES_IN_S);

  /*---------------------------------------------------------------------------------------------------------------
   * generateAccessToken
   ---------------------------------------------------------------------------------------------------------------*/
  test('generateAccessToken should return a signed JWT', () => {
    const token = generateAccessToken(userId, email);
    expect(typeof token).toBe('string');

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    expect(decoded).toHaveProperty('sub', userId.toString());
    expect(decoded).toHaveProperty('email', email);
  });

  test('generateAccessToken should throw if userId is invalid', () => {
    // @ts-expect-error
    expect(() => generateAccessToken(null, email)).toThrow(InternalError);
    // @ts-expect-error
    expect(() => generateAccessToken('abc', email)).toThrow(InternalError);
  });

  test('generateAccessToken should throw if email is invalid', () => {
    // @ts-expect-error
    expect(() => generateAccessToken(userId, null)).toThrow(InternalError);
    expect(() => generateAccessToken(userId, '')).toThrow(InternalError);
  });

  test('generateAccessToken should respect expiry (short TTL)', async () => {
    const token = generateAccessToken(new Types.ObjectId(), 'email');
    expect(typeof token).toBe('string');

    // sleep for extra 1s to ensure expiry
    await wait(atExpiresIn + 1);
    expect(() => jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!)).toThrow(jwt.TokenExpiredError);
  }, (atExpiresIn + 2) * 1000);

  /*---------------------------------------------------------------------------------------------------------------
   * generateRefreshToken
   ---------------------------------------------------------------------------------------------------------------*/
  test('generateRefreshToken should return a random string of sufficient length', () => {
    const token = generateRefreshToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThanOrEqual(64); // 48 bytes = 96 hex chars
  });

  test('generateRefreshToken should produce different values each time', () => {
    const token1 = generateRefreshToken();
    const token2 = generateRefreshToken();
    expect(token1).not.toBe(token2);
  });
});

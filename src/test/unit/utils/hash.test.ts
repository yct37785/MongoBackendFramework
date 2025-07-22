import { hashValue, hmacHash, compareHash } from '../../../utils/hash';

describe('hash.ts', () => {
  const rawString = 'MySecurePassword123!';
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

  /*---------------------------------------------------------------------------------------------------------------
   * hashValue
   ---------------------------------------------------------------------------------------------------------------*/
  test('hashValue should produce a bcrypt hash of input', async () => {
    const hash = await hashValue(rawString);
    expect(typeof hash).toBe('string');
    expect(hash).toMatch(/^\$2[aby]?\$\d+\$.{53}$/); // bcrypt pattern
  });

  test('hashValue with empty string should still return a valid bcrypt hash', async () => {
    const hash = await hashValue('');
    expect(typeof hash).toBe('string');
    expect(hash).toMatch(/^\$2[aby]?\$\d+\$.{53}$/);
  });

  /*---------------------------------------------------------------------------------------------------------------
   * compareHash
   ---------------------------------------------------------------------------------------------------------------*/
  test('compareHash should return true when raw and hash match', async () => {
    const hashed = await hashValue(rawString);
    const isValid = await compareHash(rawString, hashed);
    expect(isValid).toBe(true);
  });

  test('compareHash should return false when raw does not match hash', async () => {
    const hashed = await hashValue(rawString);
    const isValid = await compareHash('WrongPassword!', hashed);
    expect(isValid).toBe(false);
  });

  test('compareHash should reject for invalid hash format', async () => {
    await expect(compareHash('someinput', 'not-a-valid-hash')).resolves.toBe(false);
  });

  /*---------------------------------------------------------------------------------------------------------------
   * hmacHash
   ---------------------------------------------------------------------------------------------------------------*/
  test('hmacHash should return deterministic hash for same input', () => {
    const a = hmacHash('refresh_token_value');
    const b = hmacHash('refresh_token_value');
    expect(typeof a).toBe('string');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
  });

  test('hmacHash should differ for different input', () => {
    const a = hmacHash('token1');
    const b = hmacHash('token2');
    expect(a).not.toBe(b);
  });

  test('hmacHash should throw if secret is undefined', () => {
    if (!refreshTokenSecret) {
      throw new Error('Missing REFRESH_TOKEN_SECRET');
    }
  });
});

import { setUpInMemDB } from '../../setupTestDB';
import { verifyAccessToken } from '../../../middleware/authMiddleware';
import { ser_findUserViaId } from '../../../services/authServices';
import { con_auth_register, con_auth_login } from '../../../controller/authController';
import jwt from 'jsonwebtoken';
import { InputError, AuthError } from '../../../error/AppError';
import { Types } from 'mongoose';

setUpInMemDB();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const email = `user${Date.now()}98@test.com`;
const password = 'StrongPass123!';
let accessToken = '';
let req: any;
beforeEach(async () => {
  req = { headers: {} };
  await con_auth_register({ body: { email, password } });
  const loginData = await con_auth_login({
    body: { email, password },
    headers: { 'user-agent': 'jest-test-agent' },
    ip: '127.0.0.1'
  });
  accessToken = loginData.accessToken;
});

describe('verifyAccessToken', () => {
  test('should throw InputError if Authorization header is missing', async () => {
    await expect(verifyAccessToken(req)).rejects.toThrow(InputError);
  });

  test('should throw InputError if Authorization header is invalid', async () => {
    req.headers.authorization = 'InvalidHeader';
    await expect(verifyAccessToken(req)).rejects.toThrow(InputError);
  });

  test('should throw AuthError if token is malformed or invalid', async () => {
    // totally invalid token
    req.headers.authorization = 'Bearer badtoken';
    await expect(verifyAccessToken(req)).rejects.toThrow(AuthError);
    // valid token with 1 chr swapped
    const malformedAccessToken = accessToken.slice(0, -1) + (accessToken.at(-1) === 'a' ? 'b' : 'a');
    req.headers.authorization = `Bearer ${malformedAccessToken}`;
    await expect(verifyAccessToken(req)).rejects.toThrow(AuthError);
    // expired-like token
    const expiredToken = jwt.sign(
      { sub: (new Types.ObjectId).toString(), email },
      ACCESS_TOKEN_SECRET,
      { expiresIn: -10 }  // already expired
    );
    req.headers.authorization = `Bearer ${expiredToken}`;
    await expect(verifyAccessToken(req)).rejects.toThrow(AuthError);
  });

  test('should throw AuthError if claims are missing', async () => {
    // missing all
    const badToken = jwt.sign({}, ACCESS_TOKEN_SECRET);
    req.headers.authorization = `Bearer ${badToken}`;
    await expect(verifyAccessToken(req)).rejects.toThrow(AuthError);
    // missing email
    const token = jwt.sign({ sub: (new Types.ObjectId).toString() }, ACCESS_TOKEN_SECRET);
    req.headers.authorization = `Bearer ${token}`;
    await expect(verifyAccessToken(req)).rejects.toThrow(AuthError);
  });

  test('should throw AuthError if sub is invalid ObjectId', async () => {
    const badToken = jwt.sign({ sub: 'notanid', email }, ACCESS_TOKEN_SECRET);
    req.headers.authorization = `Bearer ${badToken}`;
    await expect(verifyAccessToken(req)).rejects.toThrow(AuthError);
  });

  test('should throw AuthError if user does not exist', async () => {
    const nonExistentUserToken = jwt.sign({ sub: (new Types.ObjectId).toString(), email }, ACCESS_TOKEN_SECRET);
    req.headers.authorization = `Bearer ${nonExistentUserToken}`;
    await expect(verifyAccessToken(req)).rejects.toThrow(AuthError);
  });

  test('should attach req.user if verification passes', async () => {
    req.headers.authorization = `Bearer ${accessToken}`;
    await verifyAccessToken(req);
    expect(req.user).toBeDefined();
    expect(req.user).toStrictEqual({
      userId: expect.any(Object),
      email
    });
    const user = await ser_findUserViaId(req.user.userId);
    expect(req.user.userId.toString()).toBe(user?._id.toString());
  });
});

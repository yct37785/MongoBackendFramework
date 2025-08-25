import { setUpInMemDB } from '../test/setupTestDB';
import { verifyAccessToken, verifyAccessTokenMiddleware } from './authMiddleware';
import { ser_findUserViaId } from '../services/authServices';
import { mockReq, genTestEmail, TEST_PW } from '../test/testUtils';
import { con_auth_register, con_auth_login } from '../controller/authController';
import jwt from 'jsonwebtoken';
import { InputError, AuthError } from '../error/AppError';
import { Types } from 'mongoose';

setUpInMemDB();

/******************************************************************************************************************
 * setup
 ******************************************************************************************************************/
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const testEmail = genTestEmail();
let accessToken = '';
let req: any;
beforeEach(async () => {
  req = { headers: {} };
  await con_auth_register(mockReq({ email: testEmail, password: TEST_PW }));
  const loginData = await con_auth_login(
    mockReq({ email: testEmail, password: TEST_PW }));
  accessToken = loginData.accessToken;
});

/******************************************************************************************************************
 * verifyAccessToken
 ******************************************************************************************************************/
describe('verifyAccessToken', () => {
  
  test('InputError', async () => {
    // Authorization header is missing
    await expect(verifyAccessToken(req)).rejects.toThrow(InputError);
    // Authorization header is invalid
    req.headers.authorization = 'InvalidHeader';
    await expect(verifyAccessToken(req)).rejects.toThrow(InputError);
    req.headers.authorization = undefined;
    await expect(verifyAccessToken(req)).rejects.toThrow(InputError);
    req.headers.authorization = null;
    await expect(verifyAccessToken(req)).rejects.toThrow(InputError);
    req.headers.authorization = 123;
    await expect(verifyAccessToken(req)).rejects.toThrow(InputError);
    req.headers.authorization = {};
    await expect(verifyAccessToken(req)).rejects.toThrow(InputError);
  });

  test('AuthError: invalid or malformed token value', async () => {
    // totally invalid token
    req.headers.authorization = 'Bearer badtoken';
    await expect(verifyAccessToken(req)).rejects.toThrow(AuthError);
    // valid token with 1 chr swapped
    const malformedAccessToken = accessToken.slice(0, -1) + (accessToken.at(-1) === 'a' ? 'b' : 'a');
    req.headers.authorization = `Bearer ${malformedAccessToken}`;
    await expect(verifyAccessToken(req)).rejects.toThrow(AuthError);
    // expired-like token
    const expiredToken = jwt.sign(
      { sub: (new Types.ObjectId).toString(), email: testEmail },
      ACCESS_TOKEN_SECRET,
      { expiresIn: -10 }  // already expired
    );
    req.headers.authorization = `Bearer ${expiredToken}`;
    await expect(verifyAccessToken(req)).rejects.toThrow(AuthError);
  });

  test('AuthError: claims are missing', async () => {
    // missing all
    const badToken = jwt.sign({}, ACCESS_TOKEN_SECRET);
    req.headers.authorization = `Bearer ${badToken}`;
    await expect(verifyAccessToken(req)).rejects.toThrow(AuthError);
    // missing email
    const token = jwt.sign({ sub: (new Types.ObjectId).toString() }, ACCESS_TOKEN_SECRET);
    req.headers.authorization = `Bearer ${token}`;
    await expect(verifyAccessToken(req)).rejects.toThrow(AuthError);
  });

  test('AuthError: sub is invalid', async () => {
    // invalid ObjectID
    const badToken = jwt.sign({ sub: 'notanid', email: testEmail }, ACCESS_TOKEN_SECRET);
    req.headers.authorization = `Bearer ${badToken}`;
    await expect(verifyAccessToken(req)).rejects.toThrow(AuthError);
    // user id is non-existent
    const nonExistentUserToken = jwt.sign({ sub: (new Types.ObjectId).toString(), email: testEmail }, ACCESS_TOKEN_SECRET);
    req.headers.authorization = `Bearer ${nonExistentUserToken}`;
    await expect(verifyAccessToken(req)).rejects.toThrow(AuthError);
  });

  test('verification success', async () => {
    req.headers.authorization = `Bearer ${accessToken}`;
    await verifyAccessToken(req);
    // expect req.user to be attached
    expect(req.user).toBeDefined();
    expect(req.user).toStrictEqual({
      userId: expect.any(Object),
      email: testEmail
    });
    // user found and id matches
    const user = await ser_findUserViaId(req.user.userId);
    expect(req.user.userId.toString()).toBe(user?._id.toString());
  });
});

/******************************************************************************************************************
 * verifyAccessToken
 ******************************************************************************************************************/
describe('verifyAccessTokenMiddleware', () => {
  test('calls next on successful verification and attaches req.user', async () => {
    const req: any = { headers: { authorization: `Bearer ${accessToken}` } };
    const res: any = {};
    const next = jest.fn();

    await verifyAccessTokenMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeDefined();
    expect(req.user.email).toBe(testEmail);
    expect(req.user.userId).toBeDefined();
  });
});
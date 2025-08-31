import { setUpInMemDB } from '../Test/SetupTestDB';
import { wait, expectString, expectDate, mockReq, genTestEmail, TEST_PW,
  invaid_strs, invalid_emails, invalid_pws, testInvalidInputs, malformToken
 } from '../Test/TestUtils';
import { con_auth_register, con_auth_login, con_auth_refresh, con_auth_logout } from './AuthController';
import { InputError, AuthError, ConflictError } from '../Error/AppError';

setUpInMemDB();

/******************************************************************************************************************
 * con_auth_register
 ******************************************************************************************************************/
describe('con_auth_register', () => {

  test('InputError: invalid email/password type/format', async () => {
    await testInvalidInputs(
      (email) => con_auth_register(mockReq({ email, password: TEST_PW })),
      InputError, invaid_strs, invalid_emails);
    await testInvalidInputs(
      (password) => con_auth_register(mockReq({ email: genTestEmail(), password })),
      InputError, invaid_strs, invalid_pws);
  });

  test('ConflictError: registering duplicate email', async () => {
    const sameEmail = genTestEmail();
    await con_auth_register(mockReq({ email: sameEmail, password: TEST_PW }));
    await expect(con_auth_register(mockReq({ email: sameEmail, password: TEST_PW }))).rejects.toThrow(ConflictError);
  });

  test('registered successfully', async () => {
    const result = await con_auth_register(mockReq({ email: genTestEmail(), password: TEST_PW }));
    expect(result.msg).toBe('User registered successfully');
  });
});

/******************************************************************************************************************
 * con_auth_login
 ******************************************************************************************************************/
describe('con_auth_login', () => {
  const sameEmail = genTestEmail();

  beforeEach(async () => {
    await con_auth_register(mockReq({ email: sameEmail, password: TEST_PW }));
  });

  test('InputError: invalid types', async () => {
    await testInvalidInputs(
      (email) => con_auth_login(mockReq({ email, password: TEST_PW })),
      InputError, invaid_strs);
    await testInvalidInputs(
      (password) => con_auth_login(mockReq({ email: sameEmail, password })),
      InputError, invaid_strs);
  });

  test('AuthError: wrong credentials', async () => {
    await expect(con_auth_login(mockReq({ email: sameEmail, password: 'wrongpw' }))).rejects.toThrow(AuthError);
    await expect(con_auth_login(mockReq({ email: 'notfound@example.com', password: TEST_PW }))).rejects.toThrow(AuthError);
  });

  test('login successfully', async () => {
    const result = await con_auth_login(mockReq({ email: sameEmail, password: TEST_PW }));
    expectString(result.accessToken);
    expectString(result.refreshToken);
    expectDate(result.atExpiresAt);
    expectDate(result.rtExpiresAt);
  });
});

/******************************************************************************************************************
 * con_auth_refresh
 ******************************************************************************************************************/
describe('con_auth_refresh', () => {
  const sameEmail = genTestEmail();
  let loginData: any;

  beforeEach(async () => {
    await con_auth_register(mockReq({ email: sameEmail, password: TEST_PW }));
    loginData = await con_auth_login(mockReq({ email: sameEmail, password: TEST_PW }));
  });

  test('InputError: invalid refresh token type/format', async () => {
    await testInvalidInputs(
      (refreshToken) => con_auth_refresh(mockReq({ refreshToken })),
      InputError, invaid_strs);
  });

  test('AuthError: malformed token', async () => {
    await expect(con_auth_refresh(mockReq({ refreshToken: malformToken(loginData.refreshToken) }))).rejects.toThrow(AuthError);
  });

  test('refresh successfully rotates access token but preserves refresh expiry', async () => {
    await wait(2);  // ensure that timestamp based seed will not generate same values
    const result = await con_auth_refresh(mockReq({ refreshToken: loginData.refreshToken }));
    expectString(result.accessToken);
    expectString(result.refreshToken);
    expectDate(result.atExpiresAt);
    expectDate(result.rtExpiresAt);
    expect(result.accessToken).not.toBe(loginData.accessToken);
    expect(result.refreshToken).not.toBe(loginData.refreshToken);
    expect(result.atExpiresAt.toISOString()).not.toBe(loginData.atExpiresAt.toISOString());   // access token expiry updated
    expect(result.rtExpiresAt.toISOString()).toBe(loginData.rtExpiresAt.toISOString());       // refresh token expiry always stay the same
    // refresh will fail (refresh token rotated)
    await expect(con_auth_refresh(mockReq({ refreshToken: loginData.refreshToken }))).rejects.toThrow(AuthError);
  });
});

/******************************************************************************************************************
 * con_auth_logout
 ******************************************************************************************************************/
describe('con_auth_logout', () => {
  const sameEmail = genTestEmail();
  let loginData: any;

  beforeEach(async () => {
    await con_auth_register(mockReq({ email: sameEmail, password: TEST_PW }));
    loginData = await con_auth_login(mockReq({ email: sameEmail, password: TEST_PW }));
  });

  test('InputError: invalid refresh token type/format', async () => {
    await testInvalidInputs(
      (refreshToken) => con_auth_logout(mockReq({ refreshToken })),
      InputError, invaid_strs);
  });

  test('AuthError: malformed token', async () => {
    await expect(con_auth_logout(mockReq({ refreshToken: malformToken(loginData.refreshToken) }))).rejects.toThrow(AuthError);
  });

  test('logout successfully invalidates session', async () => {
    const result = await con_auth_logout(mockReq({ refreshToken: loginData.refreshToken }));
    expect(result.msg).toBe('Logged out of session');
    // refresh will fail (session removed)
    await expect(con_auth_refresh(mockReq({ refreshToken: loginData.refreshToken }))).rejects.toThrow(AuthError);
  });
});
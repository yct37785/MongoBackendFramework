import { setUpInMemDB } from '../test/setupTestDB';
import { wait, expectString, expectDate, mockReq, genTestEmail, TEST_PW } from '../test/testUtils';
import { con_auth_register, con_auth_login, con_auth_refresh, con_auth_logout } from './authController';
import { InputError, AuthError, ConflictError } from '../error/AppError';

setUpInMemDB();

/******************************************************************************************************************
 * con_auth_register
 ******************************************************************************************************************/
describe('con_auth_register', () => {

  test('InputError', async () => {
    // invalid email
    await expect(con_auth_register(mockReq({ email: 'sfrfsxsafdsf', password: TEST_PW }))).rejects.toThrow(InputError);
    await expect(con_auth_register(mockReq({ email: '', password: TEST_PW }))).rejects.toThrow(InputError);
    await expect(con_auth_register(mockReq({ email: undefined, password: TEST_PW }))).rejects.toThrow(InputError);
    await expect(con_auth_register(mockReq({ email: null, password: TEST_PW }))).rejects.toThrow(InputError);
    await expect(con_auth_register(mockReq({ email: 123, password: TEST_PW }))).rejects.toThrow(InputError);
    await expect(con_auth_register(mockReq({ email: {}, password: TEST_PW }))).rejects.toThrow(InputError);
    // invalid password
    await expect(con_auth_register(mockReq({ email: genTestEmail(), password: 'asdasdasdsadasdasdasdsad' }))).rejects.toThrow(InputError);
    await expect(con_auth_register(mockReq({ email: genTestEmail(), password: '' }))).rejects.toThrow(InputError);
    await expect(con_auth_register(mockReq({ email: genTestEmail(), password: undefined }))).rejects.toThrow(InputError);
    await expect(con_auth_register(mockReq({ email: genTestEmail(), password: null }))).rejects.toThrow(InputError);
    await expect(con_auth_register(mockReq({ email: genTestEmail(), password: 123 }))).rejects.toThrow(InputError);
    await expect(con_auth_register(mockReq({ email: genTestEmail(), password: {} }))).rejects.toThrow(InputError);
  });

  test('ConflictError', async () => {
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
    await con_auth_register(
      mockReq({ email: sameEmail, password: TEST_PW }));
  });

  test('InputError', async () => {
    // invalid email
    await expect(con_auth_login(mockReq({ email: undefined, password: TEST_PW }))).rejects.toThrow(InputError);
    await expect(con_auth_login(mockReq({ email: null, password: TEST_PW }))).rejects.toThrow(InputError);
    await expect(con_auth_login(mockReq({ email: 23, password: TEST_PW }))).rejects.toThrow(InputError);
    await expect(con_auth_login(mockReq({ email: {}, password: TEST_PW }))).rejects.toThrow(InputError);
    // invalid password
    await expect(con_auth_login(mockReq({ email: sameEmail, password: undefined }))).rejects.toThrow(InputError);
    await expect(con_auth_login(mockReq({ email: sameEmail, password: null }))).rejects.toThrow(InputError);
    await expect(con_auth_login(mockReq({ email: sameEmail, password: 23 }))).rejects.toThrow(InputError);
    await expect(con_auth_login(mockReq({ email: sameEmail, password: {} }))).rejects.toThrow(InputError);
  });

  test('AuthError', async () => {
    // wrong email
    await expect(con_auth_login(mockReq({ email: 'sfrfsxsafdsf', password: TEST_PW }))).rejects.toThrow(AuthError);
    await expect(con_auth_login(mockReq({ email: '', password: TEST_PW }))).rejects.toThrow(AuthError);
    // wrong password
    await expect(con_auth_login(mockReq({ email: sameEmail, password: 'asdasdasdsadasdasdasdsad' }))).rejects.toThrow(AuthError);
    await expect(con_auth_login(mockReq({ email: sameEmail, password: '' }))).rejects.toThrow(AuthError);
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
    loginData = await con_auth_login(
      mockReq({ email: sameEmail, password: TEST_PW }));
  });

  test('InputError', async () => {
    // invalid refresh token type
    await expect(con_auth_refresh(mockReq({ refreshToken: undefined }))).rejects.toThrow(InputError);
    await expect(con_auth_refresh(mockReq({ refreshToken: null }))).rejects.toThrow(InputError);
    await expect(con_auth_refresh(mockReq({ refreshToken: 341341334123434 }))).rejects.toThrow(InputError);
    await expect(con_auth_refresh(mockReq({ refreshToken: {} }))).rejects.toThrow(InputError);
    // wrong refresh token format
    await expect(con_auth_refresh(mockReq({ refreshToken: 'dsfgfdgdfgdfgdfgdfgdfg' }))).rejects.toThrow(InputError);
    await expect(con_auth_refresh(mockReq({ refreshToken: '' }))).rejects.toThrow(InputError);
  });

  test('AuthError', async () => {
    // malformed refresh token value
    const malformed_rt = loginData.refreshToken.slice(0, -1) + (loginData.refreshToken.at(-1) === 'a' ? 'b' : 'a');
    await expect(con_auth_refresh(mockReq({ refreshToken: malformed_rt }))).rejects.toThrow(AuthError);
  });

  // TODO: NotFoundError

  test('refresh successfully, access token expriy updated but refresh token expiry remains the same', async () => {
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
    loginData = await con_auth_login(
      mockReq({ email: sameEmail, password: TEST_PW })
    );
  });

  test('InputError', async () => {
    // invalid refresh token type
    await expect(con_auth_logout(mockReq({ refreshToken: undefined }))).rejects.toThrow(InputError);
    await expect(con_auth_logout(mockReq({ refreshToken: null }))).rejects.toThrow(InputError);
    await expect(con_auth_logout(mockReq({ refreshToken: 341341334123434 }))).rejects.toThrow(InputError);
    await expect(con_auth_logout(mockReq({ refreshToken: {} }))).rejects.toThrow(InputError);
    // wrong refresh token format
    await expect(con_auth_logout(mockReq({ refreshToken: 'dsfgfdgdfgdfgdfgdfgdfg' }))).rejects.toThrow(InputError);
    await expect(con_auth_logout(mockReq({ refreshToken: '' }))).rejects.toThrow(InputError);
  });

  test('AuthError', async () => {
    // malformed refresh token value
    const malformed_rt = loginData.refreshToken.slice(0, -1) + (loginData.refreshToken.at(-1) === 'a' ? 'b' : 'a');
    await expect(con_auth_logout(mockReq({ refreshToken: malformed_rt }))).rejects.toThrow(AuthError);
  });

  // TODO: NotFoundError

  test('logout successfully', async () => {
    const result = await con_auth_logout(mockReq({ refreshToken: loginData.refreshToken }));
    expect(result.msg).toBe('Logged out of session');
    // refresh will fail (session removed)
    await expect(con_auth_refresh(mockReq({ refreshToken: loginData.refreshToken }))).rejects.toThrow(AuthError);
  });
});
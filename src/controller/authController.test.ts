import { setUpInMemDB } from '../test/setupTestDB';
import { wait, expectString, expectDate } from '../test/testUtils';
import { con_auth_register, con_auth_login, con_auth_refresh, con_auth_logout } from './authController';
import { InputError, AuthError, ConflictError } from '../error/AppError';

setUpInMemDB();

/******************************************************************************************************************
 * con_auth_register
 ******************************************************************************************************************/
describe('authController: con_auth_register', () => {
  const testEmail = `user${Date.now()}1@test.com`;
  const password = 'StrongPass123!';

  test('invalid input', async () => {
    // invalid email
    await expect(con_auth_register({ body: { email: 'sfrfsxsafdsf', password } })).rejects.toThrow(InputError);
    await expect(con_auth_register({ body: { email: '', password } })).rejects.toThrow(InputError);
    // invalid password
    await expect(con_auth_register({ body: { email: testEmail, password: 'asdasdasdsadasdasdasdsad' } })).rejects.toThrow(InputError);
    await expect(con_auth_register({ body: { email: testEmail, password: '' } })).rejects.toThrow(InputError);
  });

  test('success', async () => {
    const result = await con_auth_register({ body: { email: testEmail, password } });
    expect(result.msg).toBe('User registered successfully');
  });

  test('conflict', async () => {
    await con_auth_register({ body: { email: testEmail, password } });
    await expect(con_auth_register({ body: { email: testEmail, password } })).rejects.toThrow(ConflictError);
  });
});

/******************************************************************************************************************
 * con_auth_login
 ******************************************************************************************************************/
describe('authController: con_auth_login', () => {
  const testEmail = `user${Date.now()}2@test.com`;
  const password = 'StrongPass123!';

  beforeEach(async () => {
    await con_auth_register({
      body: { email: testEmail, password },
      headers: { 'user-agent': 'jest-test-agent' },
      ip: '127.0.0.1'
    });
  });

  test('invalid input/unauthorized', async () => {
    // invalid/wrong email
    await expect(con_auth_login({ body: { email: 'sfrfsxsafdsf', password } })).rejects.toThrow(AuthError);
    await expect(con_auth_login({ body: { email: '', password } })).rejects.toThrow(AuthError);
    // invalid/wrong password
    await expect(con_auth_login({ body: { email: testEmail, password: 'asdasdasdsadasdasdasdsad' } })).rejects.toThrow(AuthError);
    await expect(con_auth_login({ body: { email: testEmail, password: '' } })).rejects.toThrow(AuthError);
  });

  test('success', async () => {
    const result = await con_auth_login({ body: { email: testEmail, password } });
    expectString(result.accessToken);
    expectString(result.refreshToken);
    expectDate(result.atExpiresAt);
    expectDate(result.rtExpiresAt);
  });
});

/******************************************************************************************************************
 * con_auth_refresh
 ******************************************************************************************************************/
describe('authController: con_auth_refresh', () => {
  const testEmail = `user${Date.now()}3@test.com`;
  const password = 'StrongPass123!';
  let loginData: any;

  beforeEach(async () => {
    await con_auth_register({ body: { email: testEmail, password } });
    loginData = await con_auth_login({
      body: { email: testEmail, password },
      headers: { 'user-agent': 'jest-test-agent' },
      ip: '127.0.0.1'
    });
  });

  test('invalid input', async () => {
    // invalid refresh token type
    await expect(con_auth_refresh({ body: { refreshToken: 341341334123434 } })).rejects.toThrow(InputError);
    // empty refresh token
    await expect(con_auth_refresh({ body: { refreshToken: '' } })).rejects.toThrow(InputError);
  });

  test('unauthorized', async () => {
    // malformed refresh token value
    const malformed_rt = loginData.refreshToken.slice(0, -1) + (loginData.refreshToken.at(-1) === 'a' ? 'b' : 'a');
    await expect(con_auth_refresh({ body: { refreshToken: malformed_rt } })).rejects.toThrow(AuthError);
  });

  test('success', async () => {
    await wait(2);  // ensure that timestamp based seed will not generate same values
    const result = await con_auth_refresh({ body: { refreshToken: loginData.refreshToken } });
    expectString(result.accessToken);
    expectString(result.refreshToken);
    expectDate(result.atExpiresAt);
    expectDate(result.rtExpiresAt);
    expect(result.accessToken).not.toBe(loginData.accessToken);
    expect(result.refreshToken).not.toBe(loginData.refreshToken);
    expect(result.atExpiresAt.toISOString()).not.toBe(loginData.atExpiresAt.toISOString());   // access token expiry updated
    expect(result.rtExpiresAt.toISOString()).toBe(loginData.rtExpiresAt.toISOString());       // refresh token expiry always stay the same
  });
});

/******************************************************************************************************************
 * con_auth_logout
 ******************************************************************************************************************/
describe('authController: con_auth_logout', () => {
  const testEmail = `user${Date.now()}3@test.com`;
  const password = 'StrongPass123!';
  let loginData: any;

  beforeEach(async () => {
    await con_auth_register({ body: { email: testEmail, password } });
    loginData = await con_auth_login({
      body: { email: testEmail, password },
      headers: { 'user-agent': 'jest-test-agent' },
      ip: '127.0.0.1'
    });
  });

  test('invalid input', async () => {
    // invalid refresh token type
    await expect(con_auth_logout({ body: { refreshToken: 341341334123434 } })).rejects.toThrow(InputError);
    // empty refresh token
    await expect(con_auth_logout({ body: { refreshToken: '' } })).rejects.toThrow(InputError);
  });

  test('unauthorized', async () => {
    // malformed refresh token value
    const malformed_rt = loginData.refreshToken.slice(0, -1) + (loginData.refreshToken.at(-1) === 'a' ? 'b' : 'a');
    await expect(con_auth_logout({ body: { refreshToken: malformed_rt } })).rejects.toThrow(AuthError);
  });

  test('success', async () => {
    const result = await con_auth_logout({ body: { refreshToken: loginData.refreshToken } });
    expect(result.msg).toBe('Logged out of session');
  });
});
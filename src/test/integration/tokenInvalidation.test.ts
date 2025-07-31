import { setUpInMemDB } from '../../test/setupTestDB';
import { wait } from '../../test/testUtils';
import { con_auth_register, con_auth_login, con_auth_refresh, con_auth_logout } from '../../controller/authController';
import { AuthError } from '../../error/AppError';

setUpInMemDB();

const maxSessions = Number(process.env.MAX_SESSIONS);
const rtExpiresIn = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_S);
const testEmail = `user${Date.now()}97@test.com`;
const password = 'StrongPass123!';
let refreshToken = '';

/******************************************************************************************************************
 * Setup.
 ******************************************************************************************************************/
beforeEach(async () => {
  await con_auth_register({ body: { email: testEmail, password } });
  const loginData = await con_auth_login({
    body: { email: testEmail, password },
    headers: { 'user-agent': 'jest-test-agent' },
    ip: '127.0.0.1'
  });
  refreshToken = loginData.refreshToken;
});

/******************************************************************************************************************
 * Test token invalidation.
 ******************************************************************************************************************/
describe('int: token invalidation test', () => {
  /**
   * test invalidation via logout
   */
  test('test invalidation via logout', async () => {
    // logout
    let result = await con_auth_logout({ body: { refreshToken } });
    expect(typeof result.msg === 'string').toBeTruthy();
    // throw auth error when attempt to refresh
    await expect(con_auth_refresh({ body: { refreshToken } })).rejects.toThrow(AuthError);
  });

  /**
   * test invalidation via timeout
   */
  test('test invalidation via timeout', async () => {
    // wait for timeout + 1
    await wait(rtExpiresIn + 1);
    // throw auth error when attempt to refresh
    await expect(con_auth_refresh({ body: { refreshToken } })).rejects.toThrow(AuthError);
  }, (rtExpiresIn + 2) * 1000);

  /**
   * test invalidation via max session trim
   */
  test('test invalidation via max session trim', async () => {
    // login maxSessions times
    for (let i = 0; i < maxSessions; ++i) {
      await con_auth_login({ body: { email: testEmail, password } });
    }
    // throw auth error when attempt to refresh
    await expect(con_auth_refresh({ body: { refreshToken } })).rejects.toThrow(AuthError);
  });
});

import { setUpInMemDB } from '../src/Test/SetupTestDB';
import { wait, mockReq } from '../src/Test/TestUtils';
import { con_auth_register, con_auth_login, con_auth_refresh, con_auth_logout } from '../src/Controller/AuthController';
import { AuthError } from '../src/Error/AppError';

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
  await con_auth_register(mockReq({ email: testEmail, password }));
  const loginData = await con_auth_login(
    mockReq({ email: testEmail, password }));
  refreshToken = loginData.refreshToken;
});

/******************************************************************************************************************
 * Test token invalidation.
 ******************************************************************************************************************/
describe('int: token invalidation tests', () => {

  test('invalidation via logout', async () => {
    // logout
    let result = await con_auth_logout(mockReq({ refreshToken }));
    expect(typeof result.msg === 'string').toBeTruthy();
    // throw auth error when attempt to refresh
    await expect(con_auth_refresh(mockReq({ refreshToken }))).rejects.toThrow(AuthError);
  });

  test('invalidation via timeout', async () => {
    // wait for timeout + 1
    await wait(rtExpiresIn + 1);
    // throw auth error when attempt to refresh
    await expect(con_auth_refresh(mockReq({ refreshToken }))).rejects.toThrow(AuthError);
  }, (rtExpiresIn + 2) * 1000);

  test('invalidation via max session trim', async () => {
    // login maxSessions times
    for (let i = 0; i < maxSessions; ++i) {
      await con_auth_login(mockReq({ email: testEmail, password }));
    }
    // throw auth error when attempt to refresh
    await expect(con_auth_refresh(mockReq({ refreshToken }))).rejects.toThrow(AuthError);
  });
});

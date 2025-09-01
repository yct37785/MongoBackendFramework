import express from 'express';
const supRequest = require('supertest');
import { setUpInMemDB } from '../src/Test/SetupTestDB';
import { createApp } from '../src/App';
import { wait, TEST_PW, genTestEmail, doPost } from '../src/Test/TestUtils';
import { setupTestUsersSup } from '../src/Test/DownstreamTestUtils';

setUpInMemDB();

const maxSessions = Number(process.env.MAX_SESSIONS);
const rtExpiresIn = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_S);
let server: ReturnType<typeof supRequest>;
const email = genTestEmail();
let refreshToken: string = '';

/******************************************************************************************************************
 * Setup.
 ******************************************************************************************************************/
beforeAll(async () => {
  const app = createApp(express.Router(), express.Router());
  server = supRequest(app);
});

beforeEach(async () => {
  const { refreshTokens } = await setupTestUsersSup(server, [{ email, password: TEST_PW }]);
  refreshToken = refreshTokens[0];
});

/******************************************************************************************************************
 * Test token invalidation.
 ******************************************************************************************************************/
describe('int: token invalidation tests', () => {

  test('invalidation via logout', async () => {
    // logout
    let res = await doPost(server, '/auth/logout', '', { refreshToken });
    expect(res.status).toBe(200);
    // auth error 401 when attempt to refresh
    res = await doPost(server, '/auth/refresh', '', { refreshToken });
    expect(res.status).toBe(401);
  });

  test('invalidation via timeout', async () => {
    // wait for timeout + 1
    await wait(rtExpiresIn + 1);
    // auth error 401 when attempt to refresh
    const res = await doPost(server, '/auth/refresh', '', { refreshToken });
    expect(res.status).toBe(401);
  }, (rtExpiresIn + 2) * 1000);

  test('invalidation via max session trim', async () => {
    // login maxSessions times
    for (let i = 0; i < maxSessions; ++i) {
      await await doPost(server, '/auth/login', '', { email, password: TEST_PW });
    }
    // auth error 401 when attempt to refresh
    const res = await doPost(server, '/auth/refresh', '', { refreshToken });
    expect(res.status).toBe(401);
  });
});

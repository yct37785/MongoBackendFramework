import express from 'express';
const supRequest = require('supertest');
import { setUpInMemDB } from '../src/Test/SetupTestDB';
import { createApp } from '../src/App';
import { genTestEmail, doPost } from '../src/Test/TestUtils';
import { setupTestUsersSup } from '../src/Test/DownstreamTestUtils';

setUpInMemDB();

let server: ReturnType<typeof supRequest>;
// users
const users = [
  { email: genTestEmail(), password: 'sjnfmSDSF@d374' },
  { email: genTestEmail(), password: 'SFDasfdl#$1245' },
  { email: genTestEmail(), password: 'd83asdFGl#$1245' }
];
let refreshTokens: string[] = [];

/******************************************************************************************************************
 * Setup.
 ******************************************************************************************************************/
beforeAll(async () => {
  const app = createApp(express.Router(), express.Router());
  server = supRequest(app);
});

beforeEach(async () => {
  const res = await setupTestUsersSup(server, users);
  refreshTokens = res.refreshTokens;
});

/****************************************************************************************************************
 * Happy flow script:
 * - register and login users
 * - refresh users several times
 * - logout all users
 ****************************************************************************************************************/
test('happy flow script', async () => {
  // refresh users several times
  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < refreshTokens.length; ++j) {
      let res = await doPost(server, '/auth/refresh', '', { refreshToken: refreshTokens[j] });
      expect(res.status).toBe(200);
      refreshTokens[j] = res.body.refreshToken;
    }
  }

  // logout users
  for (let j = 0; j < refreshTokens.length; ++j) {
    let res = await doPost(server, '/auth/logout', '', { refreshToken: refreshTokens[j] });
    expect(res.status).toBe(200);
    refreshTokens[j] = res.body.refreshToken;
  }
});

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
  { email: genTestEmail(), password: 'SFDasfdl#$1245' }
];
let accesses: string[] = [];

/******************************************************************************************************************
 * Setup.
 ******************************************************************************************************************/
beforeAll(async () => {
  const app = createApp(express.Router(), express.Router());
  server = supRequest(app);
});

beforeEach(async () => {
  const { accessTokens } = await setupTestUsersSup(server, users);
  accesses = accessTokens;
});

/******************************************************************************************************************
 * Testing.
 ******************************************************************************************************************/
describe('int: security', () => {
    
  /****************************************************************************************************************
   * users cannot login with each other's password
   ****************************************************************************************************************/
  test('no cross-account login', async () => {
    let res = await doPost(server, '/auth/login', '', { email: users[0].email, password: users[1].password });
    expect(res.status).toBe(401);
    res = await doPost(server, '/auth/login', '', { email: users[1].email, password: users[0].password });
    expect(res.status).toBe(401);
  });
});

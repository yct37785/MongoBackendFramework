import express from 'express';
const supRequest = require('supertest');
import { setUpInMemDB } from '../src/Test/SetupTestDB';
import { createApp } from '../src/App';
import { genTestEmail, doPost, doGet } from '../src/Test/TestUtils';

setUpInMemDB();

let server: ReturnType<typeof supRequest>;
// users
const user1_email = genTestEmail();
const user2_email = genTestEmail();
const user1_pw = 'sjnfmSDSF@d374';
const user2_pw = 'SFDasfdl#$1245';
let user1_access = '';
let user2_access = '';

/******************************************************************************************************************
 * Setup.
 ******************************************************************************************************************/
beforeAll(async () => {
  const app = createApp(express.Router(), express.Router());
  server = supRequest(app);
});

beforeEach(async () => {
  // register
  await doPost(server, '/auth/register', { email: user1_email, password: user1_pw });
  await doPost(server, '/auth/register', { email: user2_email, password: user2_pw });
  // login
  const user1 = await doPost(server, '/auth/login', { email: user1_email, password: user1_pw });
  const user2 = await doPost(server, '/auth/login', { email: user2_email, password: user2_pw });
  user1_access = user1.body.accessToken;
  user2_access = user2.body.accessToken;
});

/******************************************************************************************************************
 * Testing.
 ******************************************************************************************************************/
describe('int: security', () => {
    
  /****************************************************************************************************************
   * users cannot login with each other's password
   ****************************************************************************************************************/
  test('no cross-account login', async () => {
    let res = await doPost(server, '/auth/login', { email: user1_email, password: user2_pw });
    expect(res.status).toBe(401);
    res = await doPost(server, '/auth/login', { email: user2_email, password: user1_pw });
    expect(res.status).toBe(401);
  });
});

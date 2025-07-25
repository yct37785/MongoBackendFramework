const request = require('supertest');
import { setUpInMemDB } from '../setupTestDB';
import { createApp } from '../../app'; // framework app
import express from 'express';
import { con_auth_register, con_auth_login } from '../../controller/authController';
import { Types } from 'mongoose';

setUpInMemDB();

let server: ReturnType<typeof request>;
let accessToken: string = '';
const email = `testuser${Date.now()}@test.com`;
const password = 'Test12345!';

/******************************************************************************************************************
 * Setup.
 ******************************************************************************************************************/
beforeEach(async () => {
  // create test user and login to get JWT
  await con_auth_register({ body: { email, password } });
  const loginResult = await con_auth_login({
    body: { email, password },
    headers: { 'user-agent': 'jest-agent' },
    ip: '127.0.0.1'
  });

  accessToken = loginResult.accessToken;

  // setup framework app with protected test route
  const protectedRoutes = express.Router();
  protectedRoutes.get('/dev/protected', (req, res) => {
    const user = req.user;
    res.status(200).json({ userId: user?.userId.toString() });
  });

  const unprotectedRoutes = express.Router();
  const app = createApp(unprotectedRoutes, protectedRoutes);
  server = request(app);
});

/******************************************************************************************************************
 * Protected routes test.
 ******************************************************************************************************************/
describe('int: protected route test', () => {
  /**
   * no token
   */
  test('should reject request with no token', async () => {
    const res = await server.get('/dev/protected');

    expect(res.status).toBe(400); // missing or invalid header
    expect(res.body.err).toMatch('Invalid input: missing or invalid auth header');
  });

  /**
   * wrong token
   */
  test('should reject request with wrong token', async () => {
    const res = await server
      .get('/dev/protected')
      .set('Authorization', 'Bearer wrong.token.here');

    expect(res.status).toBe(401);
    expect(res.body.err).toMatch('Unauthorized: invalid or expired access token');
  });

  /**
   * valid token
   */
  test('should allow access with valid token', async () => {
    const res = await server
      .get('/dev/protected')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Types.ObjectId.isValid(res.body.userId)).toBe(true);
  });
});
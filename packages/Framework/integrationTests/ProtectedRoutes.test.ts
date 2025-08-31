import express from 'express';
const request = require('supertest');
import { setUpInMemDB } from '../src/Test/SetupTestDB';
import { createApp } from '../src/App'; // framework app
import { con_auth_register, con_auth_login } from '../src/Controller/AuthController';
import { mockReq } from '../src/Test/TestUtils';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';

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
  await con_auth_register(mockReq({ email, password }));
  const loginResult = await con_auth_login(
    mockReq({ email, password }));

  accessToken = loginResult.accessToken;

  // setup framework app with protected + unprotected test routes
  const protectedRoutes = express.Router();
  protectedRoutes.get('/dev/protected', (req, res) => {
    const user = req.user;
    res.status(200).json({ userId: user?.userId.toString() });
  });
  protectedRoutes.post('/dev/protected', (req, res) => {
    const user = req.user;
    res.status(200).json({ msg: 'POST success', userId: user?.userId.toString() });
  });

  const unprotectedRoutes = express.Router();
  const app = createApp(unprotectedRoutes, protectedRoutes);
  server = request(app);
});

/******************************************************************************************************************
 * Protected routes test.
 ******************************************************************************************************************/
describe('int: protected route tests', () => {

  test('reject request with no token', async () => {
    const res = await server.get('/dev/protected');
    expect(res.status).toBe(400);
    expect(res.body.err).toMatch('Invalid input: missing or invalid auth header');
  });

  test('reject request with wrong token', async () => {
    const res = await server
      .post('/dev/protected')
      .set('Authorization', 'Bearer wrong.token.here');

    expect(res.status).toBe(401);
    expect(res.body.err).toMatch('Unauthorized: invalid or expired access token');
  });

  test('rejects expired token', async () => {
    const expiredToken = jwt.sign(
      { userId: new Types.ObjectId().toString() },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: '-1s' } // already expired
    );

    const res = await server
      .get('/dev/protected')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.err).toMatch('Unauthorized: invalid or expired access token');
  });

  test('allow access with valid token', async () => {
    const res = await server
      .get('/dev/protected')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Types.ObjectId.isValid(res.body.userId)).toBe(true);
  });

  test('allow access with valid token (lowercase header)', async () => {
    const res = await server
      .post('/dev/protected')
      .set('authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Types.ObjectId.isValid(res.body.userId)).toBe(true);
  });
});

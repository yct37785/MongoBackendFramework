import express from 'express';
const supRequest = require('supertest');
import { setUpInMemDB } from '../src/Test/SetupTestDB';
import { createApp } from '../src/App';
import { TEST_PW, genTestEmail } from '../src/Test/TestUtils';
import { setupTestUsersSup } from '../src/Test/DownstreamTestUtils';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';

setUpInMemDB();

let server: ReturnType<typeof supRequest>;
const email = genTestEmail();
let accessToken: string = '';

/******************************************************************************************************************
 * Setup.
 ******************************************************************************************************************/
beforeAll(async () => {
  // setup framework app with protected test routes
  const protectedRoutes = express.Router();
  protectedRoutes.get('/dev/protected', (req, res) => {
    const user = req.user;
    res.status(200).json({ userId: user?.userId.toString() });
  });
  protectedRoutes.post('/dev/protected', (req, res) => {
    const user = req.user;
    res.status(200).json({ msg: 'POST success', userId: user?.userId.toString() });
  });
  const app = createApp(express.Router(), protectedRoutes);
  server = supRequest(app);
});

beforeEach(async () => {
  const { accessTokens } = await setupTestUsersSup(server, [{ email, password: TEST_PW }]);
  accessToken = accessTokens[0];
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

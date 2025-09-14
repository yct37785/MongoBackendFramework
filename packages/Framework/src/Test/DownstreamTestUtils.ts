import type { Request } from 'express';
const supRequest = require('supertest');
import { Types } from 'mongoose';
import { verifyAccessToken } from '../Middleware/AuthMiddleware';
import { mockReq, doPost } from '../Test/TestUtils';
import { con_auth_register, con_auth_login } from '../Controller/AuthController';

/******************************************************************************************************************
 * [ASYNC] Register and login a valid user via controller functions.
 *
 * @param email - email to register
 * @param password - password to register
 *
 * @return - registered user userId
 ******************************************************************************************************************/
export async function setupTestUserCon(email: string, password: string): Promise<Types.ObjectId> {
  await con_auth_register(mockReq({ email, password }));
  const loginData = await con_auth_login(mockReq({ email, password }));
  const req: Partial<Request> = {
    headers: { 'authorization': `Bearer ${loginData.accessToken}` }
  };
  await verifyAccessToken(req as Request);
  if (!req.user?.userId) {
    fail();
  }
  return req.user.userId;
}

/******************************************************************************************************************
 * [ASYNC] Setup users with supertest.
 *
 * @param server - supertest created Express app
 * @param users - list of account details (email and password)
 *
 * @return - list of tokens corresponding to given users:
 *   - accessTokens: string[] - list of access tokens
 *   - refreshTokens: string[] - list of refresh tokens
 ******************************************************************************************************************/
export async function setupTestUsersSup(
  server: ReturnType<typeof supRequest>,
  users: { email: string; password: string }[]
): Promise<{ accessTokens: string[], refreshTokens: string[] }> {
  const accessTokens: string[] = [];
  const refreshTokens: string[] = [];

  for (const { email, password } of users) {
    // register
    await doPost(server, '/auth/register', '', { email, password });
    // login
    const loginRes = await doPost(server, '/auth/login', '', { email, password });
    accessTokens.push(loginRes.body.accessToken);
    refreshTokens.push(loginRes.body.refreshToken);
  }

  return { accessTokens, refreshTokens };
}
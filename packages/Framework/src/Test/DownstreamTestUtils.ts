import type { Request } from 'express';
import { Types } from 'mongoose';
import { verifyAccessToken } from '../Middleware/AuthMiddleware';
import { mockReq } from '../Test/TestUtils';
import { con_auth_register, con_auth_login } from '../Controller/AuthController';

/******************************************************************************************************************
 * Register and login a valid user.
 *
 * @param email - email to register
 * @param password - password to register
 *
 * @returns ObjectId - registered user userId
 ******************************************************************************************************************/
export async function registerAndLogin(email: string, password: string): Promise<Types.ObjectId> {
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
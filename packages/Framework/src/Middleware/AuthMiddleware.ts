import { Request, Response, NextFunction } from 'express';
import { ser_findUserViaId } from '../Services/AuthServices';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { InputError, AuthError } from '../Error/AppError';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;

/******************************************************************************************************************
 * Verifies a JWT access token from the `Authorization` header and attaches the user to the request object.
 *
 * @param req - Express request containing `Authorization: Bearer <token>` header
 *
 * @throws {InputError} if the Authorization header is missing or malformed
 * @throws {AuthError} if the token is invalid, expired, or the user cannot be found
 ******************************************************************************************************************/
export async function verifyAccessToken(req: Request) {
  const authHeader = req.headers.authorization;

  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    throw new InputError('missing or invalid auth header');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { sub: string; email: string };

    if (!decoded?.sub || !decoded?.email) {
      throw new AuthError('missing required claims');
    }

    // validate that sub is a valid ObjectId
    if (!Types.ObjectId.isValid(decoded.sub)) {
      throw new AuthError('userId is not a valid ObjectId');
    }

    // verify user exists
    const user = await ser_findUserViaId(new Types.ObjectId(decoded.sub));
    if (!user) {
      throw new AuthError('user not found');
    }

    // attach user info to req
    req.user = {
      userId: new Types.ObjectId(decoded.sub),
      email: decoded.email,
    };
  } catch (err) {
    throw new AuthError('invalid or expired access token');
  }
}

/******************************************************************************************************************
 * Express middleware wrapper for verifyAccessToken.
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 *
 * @throws refer to verifyAccessToken
 ******************************************************************************************************************/
export async function verifyAccessTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  await verifyAccessToken(req);
  next();
}

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { UserModel } from '../Models/UserModel';
import { InputError, AuthError } from '../Error/AppError';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;

/******************************************************************************************************************
* [ASYNC] Verifies the access token and attaches authentication context to the request.
 *
 * @param req - Express request:
 *   - headers: obj - request headers:
 *       + authorization?: string - bearer credential in the form "Bearer <token>"
 *   - cookies?: obj - optional cookie store:
 *       + accessToken?: string - access token if transported via cookie
 * @param res - Express response (unused on success)
 * @param next - Express next callback to continue the pipeline
 *
 * @return - passes control to subsequent handlers when authentication succeeds
 *
 * @throws {AuthError} when the token is missing, malformed, or expired
 * @throws {NotFoundError} when the token subject or session cannot be found
 * @throws {PermissionError} when the authenticated principal lacks required privileges (if enforced here)
 *
 * @usage
 * ```ts
 * app.use("/api/protected", authMiddleware, (req, res) => {
 *   // req.user is available here
 *   res.json({ ok: true });
 * });
 * ```
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
    const user = await UserModel.findById(new Types.ObjectId(decoded.sub)).exec();
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

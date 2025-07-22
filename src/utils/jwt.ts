import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { InternalError } from '../error/AppError';
import { REFRESH_TOKEN_LEN } from '../consts'; 
const ACCESS_TOKEN_EXPIRES_IN_S = Number(process.env.ACCESS_TOKEN_EXPIRES_IN_S);

/******************************************************************************************************************
 * Generates a short-lived access token (JWT) for API authorization.
 * 
 * @param user - user id
 * @param email - user email
 * @returns a signed JWT access token string
 *
 * - Payload: { sub, email }
 * - Secret: ACCESS_TOKEN_SECRET
 * - Expiry: e.g. 60s
 ******************************************************************************************************************/
export function generateAccessToken(userId: Types.ObjectId, email: string): string {
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new InternalError('invalid user ID for token generation');
  }
  if (typeof email !== 'string' || email.length === 0) {
    throw new InternalError('invalid email for token generation');
  }

  return jwt.sign(
    { sub: userId.toString(), email },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: `${ACCESS_TOKEN_EXPIRES_IN_S}s` }
  );
}

/******************************************************************************************************************
 * Generates a secure, opaque refresh token (non-JWT).
 * 
 * @returns a random string (e.g. 64-character hex)
 ******************************************************************************************************************/
export function generateRefreshToken(): string {
  return crypto.randomBytes(REFRESH_TOKEN_LEN / 2).toString('hex'); // 96 characters of entropy
}

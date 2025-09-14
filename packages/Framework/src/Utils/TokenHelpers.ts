import { Types } from 'mongoose';
import { hmacHash } from '../Utils/Hash';
import { generateAccessToken, generateRefreshToken } from '../Utils/JWT';
import { IRefreshToken } from '../Models/UserModel';

const ACCESS_TOKEN_EXPIRES_IN_S = Number(process.env.ACCESS_TOKEN_EXPIRES_IN_S);
const REFRESH_TOKEN_EXPIRES_IN_S = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_S);
const MAX_SESSIONS = Number(process.env.MAX_SESSIONS);

/******************************************************************************************************************
 * Generates a new access + refresh token pair with expiry timestamps.
 * 
 * @param userId - user's ObjectId
 * @param email - user's email
 * 
 * @return - tokens and corresponding expiry timestamps:
 *   - accessToken: string
 *   - refreshToken: string
 *   - hashedToken: string - hashed refresh token for storing in DB
 *   - atExpiresAt: Date - access token expiry date
 *   - rtExpiresAt: Date - refresh token expiry date
 * 
 * @throws {Error} if token generation fails
 ******************************************************************************************************************/
export function generateNewTokens(userId: Types.ObjectId, email: string): {
  accessToken: string;
  refreshToken: string;
  hashedToken: string;
  atExpiresAt: Date;
  rtExpiresAt: Date;
} {
  const now = Date.now();
  const accessToken = generateAccessToken(userId, email);
  const refreshToken = generateRefreshToken();
  const hashedToken = hmacHash(refreshToken);

  return {
    accessToken,
    refreshToken,
    hashedToken,
    atExpiresAt: new Date(now + ACCESS_TOKEN_EXPIRES_IN_S * 1000),
    rtExpiresAt: new Date(now + REFRESH_TOKEN_EXPIRES_IN_S * 1000),
  };
}

/******************************************************************************************************************
 * Create a refresh token entry object for storing in DB.
 * 
 * @param tokenHash - hashed refresh token
 * @param rtExpiresAt - refresh token expiry date
 * @param userAgent? - device info
 * @param ip? - IP address
 * 
 * @return - IRefreshToken shaped obj:
 *   - tokenHash: string - mirrored from param
 *   - createdAt: string - datetime now
 *   - lastUsedAt: Date - datetime now
 *   - expiresAt: Date - mirrored from param (rtExpiresAt)
 *   - userAgent?: string - mirrored from param
 *   - ip?: string - mirrored from param
 ******************************************************************************************************************/
export function createRefreshTokenEntry(
  tokenHash: string,
  rtExpiresAt: Date,
  userAgent?: string,
  ip?: string
): IRefreshToken {
  const now = new Date();
  return {
    tokenHash,
    createdAt: now,
    lastUsedAt: now,
    expiresAt: rtExpiresAt,
    userAgent,
    ip,
  };
}

/******************************************************************************************************************
 * Clean up a user's refresh token list:
 *  - removes expired tokens
 *  - sorts by createdAt descending
 *  - slices to enforce max session limit
 * 
 * @param tokens - array of IRefreshToken entries
 * 
 * @return - cleaned and sorted array of IRefreshToken
 ******************************************************************************************************************/
export function pruneAndSortRefreshTokens(tokens: IRefreshToken[]): IRefreshToken[] {
  const now = new Date();
  return tokens
    .filter(rt => rt.expiresAt > now)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, MAX_SESSIONS);
}

/******************************************************************************************************************
 * Check if a refresh token is expired based on `expiresAt`.
 * 
 * @param token - IRefreshToken entry
 * 
 * @return - true if expired, false otherwise
 ******************************************************************************************************************/
export function isRefreshTokenExpired(token: IRefreshToken): boolean {
  return token.expiresAt.getTime() < Date.now();
}

/******************************************************************************************************************
 * Remove a specific token (by hash) from a list of IRefreshToken.
 * 
 * @param tokens - array of IRefreshToken
 * @param tokenHash - token hash to remove
 * 
 * @return - new array without the removed token
 ******************************************************************************************************************/
export function removeTokenFromList(tokens: IRefreshToken[], tokenHash: string): IRefreshToken[] {
  return tokens.filter(rt => rt.tokenHash !== tokenHash);
}
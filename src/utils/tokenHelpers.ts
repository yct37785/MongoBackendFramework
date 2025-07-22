import { Types } from 'mongoose';
import { hmacHash } from '../utils/hash';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { IRefreshToken } from '../models/userModel';

const ACCESS_TOKEN_EXPIRES_IN_S = Number(process.env.ACCESS_TOKEN_EXPIRES_IN_S);
const REFRESH_TOKEN_EXPIRES_IN_S = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_S);
const MAX_SESSIONS = Number(process.env.MAX_SESSIONS);

/******************************************************************************************************************
 * Generate a new access + refresh token pair, and compute expiry timestamps.
 * 
 * @param userId - User's ObjectId
 * @param email - User's email
 * @returns Tokens + hashed refresh token and expiry dates
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
 * @param tokenHash - Hashed refresh token
 * @param rtExpiresAt - Refresh token expiry date
 * @param userAgent - Optional device info
 * @param ip - Optional IP address
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
 *  - Removes expired tokens
 *  - Sorts by createdAt descending
 *  - Slices to enforce max session limit
 * 
 * @param tokens - Array of IRefreshToken
 * @returns Cleaned and sorted list of active sessions
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
 * @param token - the IRefreshToken entry
 * @returns true if expired
 ******************************************************************************************************************/
export function isRefreshTokenExpired(token: IRefreshToken): boolean {
  return token.expiresAt.getTime() < Date.now();
}

/******************************************************************************************************************
 * Remove a specific token (by hash) from a list of IRefreshToken.
 * 
 * @param tokens - array of IRefreshToken
 * @param tokenHash - hash to remove
 * @returns new array without the token
 ******************************************************************************************************************/
export function removeTokenFromList(tokens: IRefreshToken[], tokenHash: string): IRefreshToken[] {
  return tokens.filter(rt => rt.tokenHash !== tokenHash);
}
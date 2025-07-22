import { InputError, AuthError, NotFoundError, ConflictError } from '../error/AppError';
import { compareHash, hmacHash } from '../utils/hash';
import {
  generateNewTokens, createRefreshTokenEntry, pruneAndSortRefreshTokens,
  isRefreshTokenExpired, removeTokenFromList
} from '../utils/tokenHelpers';
import { sanitizeEmail, sanitizePassword } from '../utils/inputSanitizer';
import { REFRESH_TOKEN_LEN } from '../consts';
import { ser_createUser, ser_findUserViaEmail, ser_findUserViaRT } from '../services/authServices';

/******************************************************************************************************************
 * POST /auth/register
 * Register a user with given email and password.
 *
 * Request body:
 * {
 *   email: string
 *   password: string
 * }
 *
 * Success response (201):
 * {
 *   msg: string
 * }
 ******************************************************************************************************************/
export async function con_auth_register(req: any) {
  // validate required fields
  const validatedEmail = sanitizeEmail(req.body.email);
  const validatedPassword = sanitizePassword(req.body.password);

  // check for existing user
  const existing = await ser_findUserViaEmail(validatedEmail);
  if (existing) {
    throw new ConflictError('email already registered');
  }

  // create user
  await ser_createUser(validatedEmail, validatedPassword);
  // console.log('\nUser created -> email:', validatedEmail);
  return { msg: 'User registered successfully' };
}

/******************************************************************************************************************
 * POST /auth/login
 * Authenticates a user with given email and password.
 * Issues new access + refresh token and stores the session.
 *
 * Request body:
 * {
 *   email: string
 *   password: string
 * }
 *
 * Success response (200):
 * {
 *   accessToken: string,
 *   refreshToken: string,
 *   atExpiresAt: ISO datestring,
 *   rtExpiresAt: ISO datestring
 * }
 ******************************************************************************************************************/
export async function con_auth_login(req: any) {
  const email = req.body.email;
  const password = req.body.password;
  const userAgent = (req.headers && req.headers['user-agent']) ?? undefined;
  const ip = req.ip ?? undefined;
  // validate email and password: no need full sanitization
  if (typeof email !== 'string') throw new InputError('email');
  if (typeof password !== 'string') throw new InputError('password');

  // check for existing user
  const user = await ser_findUserViaEmail(email);
  if (!user || !(await compareHash(password, user.passwordHash))) {
    throw new AuthError('wrong email or password');
  }

  // generate a new access + refresh token pair
  const newTokens = generateNewTokens(user._id, user.email);

  // create a new refresh token entry
  const newEntry = createRefreshTokenEntry(
    newTokens.hashedToken,
    newTokens.rtExpiresAt,
    userAgent,
    ip
  );

  // merge old + new sessions and prune expired ones
  user.refreshTokens = pruneAndSortRefreshTokens([
    ...user.refreshTokens,
    newEntry,
  ]);

  await user.save();

  // console.log(`\nUser logged in -> email: ${user.email}, active sessions: ${user.refreshTokens.length}`);
  return {
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken,
    atExpiresAt: newTokens.atExpiresAt,
    rtExpiresAt: newTokens.rtExpiresAt
  };
}

/******************************************************************************************************************
 * POST /auth/refresh
 * Rotate a valid refresh token:
 * - if valid and unexpired, returns new access + refresh tokens
 * - if token is invalid or reused, optionally revokes all sessions
 *
 * Request body:
 * {
 *   refreshToken: string
 * }
 *
 * Success response (200):
 * {
 *   accessToken: string,
 *   refreshToken: string,
 *   atExpiresAt: ISO datestring,
 *   rtExpiresAt: ISO datestring
 * }
 ******************************************************************************************************************/
export async function con_auth_refresh(req: any) {
  const refreshToken = req.body.refreshToken;
  const userAgent = (req.headers && req.headers['user-agent']) ?? undefined;
  const ip = req.ip ?? undefined;
  // validate refresh token
  if (typeof refreshToken !== 'string' || refreshToken.length !== REFRESH_TOKEN_LEN) {
    throw new InputError('missing or invalid refresh token');
  }

  // hash the provided token to match stored hashed values
  const hashedToken = hmacHash(refreshToken);

  // look up user by token hash
  const user = await ser_findUserViaRT(hashedToken);

  // token reuse or not found
  if (!user) {
    throw new AuthError('refresh token not allowed');
  }

  // locate the specific token entry in the user's session list
  const tokenEntry = user.refreshTokens.find(rt => rt.tokenHash === hashedToken);
  if (!tokenEntry) {
    throw new NotFoundError('session not found');
  }

  // check expiration
  if (isRefreshTokenExpired(tokenEntry)) {
    // console.log(`\nRefresh token for ${user.email} has expired.`);
    user.refreshTokens = removeTokenFromList(user.refreshTokens, hashedToken);
    await user.save();
    throw new AuthError('session expired');
  }

  // generate new tokens
  const newTokens = generateNewTokens(user._id, user.email);
  const nowDate = new Date();

  // rotate the existing session entry with new token + metadata
  tokenEntry.tokenHash = newTokens.hashedToken;
  tokenEntry.createdAt = nowDate;
  tokenEntry.lastUsedAt = nowDate;
  tokenEntry.userAgent = userAgent;
  tokenEntry.ip = ip;
  // preserve existing expiresAt (refresh token, we do not store access token expiry)

  // cleanup sessions: remove expired and trim to max allowed
  user.refreshTokens = pruneAndSortRefreshTokens(user.refreshTokens);

  await user.save();

  // console.log(`\nUser refreshed -> email: ${user.email}, active sessions: ${user.refreshTokens.length}`);
  return {
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken,
    atExpiresAt: newTokens.atExpiresAt,
    rtExpiresAt: tokenEntry.expiresAt,
  };
}

/******************************************************************************************************************
 * POST /auth/logout
 * Logout (invalidate) a single session based on its refresh token.
 *
 * Request Body:
 * {
 *   refreshToken: string
 * }
 *
 * Success response (200):
 * {
 *   msg: string
 * }
 ******************************************************************************************************************/
export async function con_auth_logout(req: any) {
  const refreshToken = req.body.refreshToken;
  // validate refresh token
  if (typeof refreshToken !== 'string' || refreshToken.length !== REFRESH_TOKEN_LEN) {
    throw new InputError('missing or invalid refresh token');
  }

  // hash the provided refresh token
  const hashedToken = hmacHash(refreshToken);
  const user = await ser_findUserViaRT(hashedToken);

  // token reuse or not found
  if (!user) {
    throw new AuthError('refresh token not allowed');
  }

  // filter out the matching token
  const before = user.refreshTokens.length;
  user.refreshTokens = user.refreshTokens.filter(rt => rt.tokenHash !== hashedToken);

  if (user.refreshTokens.length === before) {
    throw new NotFoundError('session not found');
  }

  await user.save();

  // console.log(`\nUser logged out -> email: ${user.email}, active sessions: ${user.refreshTokens.length}`);
  return { msg: 'Logged out of session' };
}

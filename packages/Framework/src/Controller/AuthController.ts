import { Request } from 'express';
import { InputError, AuthError, NotFoundError, ConflictError } from '../Error/AppError';
import { compareHash, hmacHash } from '../Utils/Hash';
import {
  generateNewTokens, createRefreshTokenEntry, pruneAndSortRefreshTokens,
  isRefreshTokenExpired, removeTokenFromList
} from '../Utils/TokenHelpers';
import { sanitizeEmail, sanitizePassword } from '../Utils/InputSanitizer';
import { REFRESH_TOKEN_LEN } from '../Consts';
import { ser_createUser, ser_findUserViaEmail, ser_findUserViaRT } from '../Services/AuthServices';

/******************************************************************************************************************
 * Registers a new user using the provided email and password.
 *
 * @param req - Express request containing:
 *   - `req.body.email`: string - user's email address
 *   - `req.body.password`: string - user's password
 *
 * @returns any:
 *   - `msg`: string - confirmation message that user was registered
 *
 * @throws {InputError} if the email or password is missing or invalid
 * @throws {ConflictError} if the email is already registered
 ******************************************************************************************************************/
export async function con_auth_register(req: Request) {
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
  return { msg: 'User registered successfully' };
}

/******************************************************************************************************************
 * Logs in a user using the provided credentials and issues new access + refresh tokens.
 *
 * @param req - Express request containing:
 *   - `req.body.email`: string - user's email
 *   - `req.body.password`: string - user's password
 *   - `req.headers['user-agent']?`: string - to record device info
 *   - `req.ip?`: string - to record IP address
 *
 * @returns any:
 *   - `accessToken`: string - JWT access token
 *   - `refreshToken`: string - JWT refresh token
 *   - `atExpiresAt`: string - ISO datetime of access token expiry
 *   - `rtExpiresAt`: string - ISO datetime of refresh token expiry
 *
 * @throws {InputError} if input is missing or invalid
 * @throws {AuthError} if email or password is incorrect
 ******************************************************************************************************************/
export async function con_auth_login(req: Request) {
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

  return {
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken,
    atExpiresAt: newTokens.atExpiresAt,
    rtExpiresAt: newTokens.rtExpiresAt
  };
}

/******************************************************************************************************************
 * Rotates a valid refresh token to issue new tokens and update session metadata.
 * 
 * @param req - Express request containing:
 *   - `req.body.refreshToken`: string - JWT refresh token
 *   - `req.headers['user-agent']?`: string - to record device info
 *   - `req.ip?`: string - to record IP address
 *
 * @returns any:
 *   - `accessToken`: string - new JWT access token
 *   - `refreshToken`: string - new JWT refresh token
 *   - `atExpiresAt`: string - ISO datetime of new access token expiry
 *   - `rtExpiresAt`: string - ISO datetime of refresh token expiry, will still be the same as before
 *
 * @throws {InputError} if refresh token is missing or invalid
 * @throws {AuthError} if the token is reused or invalid
 * @throws {NotFoundError} if the session was not found
 ******************************************************************************************************************/
export async function con_auth_refresh(req: Request) {
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

  return {
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken,
    atExpiresAt: newTokens.atExpiresAt,
    rtExpiresAt: tokenEntry.expiresAt,
  };
}

/******************************************************************************************************************
 * Logs the user out by invalidating a single refresh token session.
 *
 * @param req - Express request containing:
 *   - `req.body.refreshToken`: string - refresh token to invalidate
 *
 * @returns any:
 *   - `msg`: string - confirmation message that logout was successful
 *
 * @throws {InputError} if the refresh token is missing or invalid
 * @throws {AuthError} if token reuse is detected or token is not found
 * @throws {NotFoundError} if the session was not found
 ******************************************************************************************************************/
export async function con_auth_logout(req: Request) {
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

  return { msg: 'Logged out of session' };
}

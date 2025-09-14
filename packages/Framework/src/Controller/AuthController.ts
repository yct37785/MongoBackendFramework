import { Request } from 'express';
import { UserModel } from '../Models/UserModel';
import { InputError, AuthError, NotFoundError, ConflictError } from '../Error/AppError';
import { compareHash, hmacHash, hashValue } from '../Utils/Hash';
import {
  generateNewTokens, createRefreshTokenEntry, pruneAndSortRefreshTokens,
  isRefreshTokenExpired, removeTokenFromList
} from '../Utils/TokenHelpers';
import { sanitizeEmail, sanitizePassword } from '../Utils/InputSanitizer';
import { REFRESH_TOKEN_LEN } from '../Consts';

/******************************************************************************************************************
 * [ASYNC] Registers a new user using the provided email and password.
 *
 * @param req - Express request:
 *   - body: obj - request body:
 *       + email: string - user's email address
 *       + password: string - user's password
 *
 * @return - operation result:
 *   - msg: string - confirmation message that the user was registered
 *
 * @throws {InputError} when the email or password is missing or invalid
 * @throws {ConflictError} when the email is already registered
 ******************************************************************************************************************/
export async function con_auth_register(req: Request) {
  // validate required fields
  const email = sanitizeEmail(req.body.email);
  const password = sanitizePassword(req.body.password);

  // check for existing user
  const existing = await UserModel.findOne({ email }).exec();
  if (existing) {
    throw new ConflictError('email already registered');
  }

  // create user
  const passwordHash = await hashValue(password);
  const newUser = new UserModel({
    email,
    passwordHash,
    refreshTokens: [],
  });
  await newUser.save();

  return { msg: 'User registered successfully' };
}

/******************************************************************************************************************
 * [ASYNC] Authenticates a user with email and password and issues tokens.
 *
 * @param req - Express request:
 *   - body: obj - request body:
 *       + email: string - user's email address
 *       + password: string - user's password
 *   - headers: obj - request headers:
 *       + user-agent?: string - optional device/user agent for session context
 *   - ip?: string - optional client IP address for session context
 *
 * @return - authentication result:
 *   - accessToken: string - short-lived access token
 *   - refreshToken: string - long-lived refresh token
 *   - atExpiresAt: string - ISO timestamp when the access token expires
 *   - rtExpiresAt: string - ISO timestamp when the refresh token expires
 *
 * @throws {InputError} when the email or password is missing or invalid
 * @throws {AuthError} when credentials are incorrect or authentication fails
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
  const user = await UserModel.findOne({ email }).exec();
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
 * [ASYNC] Rotates tokens using a valid refresh token and returns new credentials.
 *
 * @param req - Express request:
 *   - body: obj - request body:
 *       + refreshToken: string - refresh token used to obtain new credentials
 *   - headers: obj - request headers:
 *       + user-agent?: string - optional device/user agent for session context
 *   - ip?: string - optional client IP address for session context
 *
 * @return - refreshed authentication result:
 *   - accessToken: string - newly issued access token
 *   - refreshToken: string - newly issued refresh token
 *   - atExpiresAt: string - ISO timestamp when the new access token expires
 *   - rtExpiresAt: string - ISO timestamp when the refresh token expires
 *
 * @throws {InputError} when the refresh token is missing or invalid
 * @throws {AuthError} when token reuse is detected or the refresh token is expired/forbidden
 * @throws {NotFoundError} when the refresh session cannot be found
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
  const user = await UserModel.findOne({ 'refreshTokens.tokenHash': hashedToken }).exec();

  // token reuse or not found
  if (!user) {
    throw new AuthError('refresh token not allowed');
  }

  // locate the specific token entry in the user's session list
  const tokenEntry = user.refreshTokens.find(rt => rt.tokenHash === hashedToken);
  // it is guranteed to not be null, included however for TS safety
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
 * [ASYNC] Logs the user out by invalidating a single refresh token session.
 *
 * @param req - Express request:
 *   - body: obj - request body:
 *       + refreshToken: string - refresh token to invalidate
 *
 * @return - operation result:
 *   - msg: string - confirmation message that logout was successful
 *
 * @throws {InputError} when the refresh token is missing or invalid
 * @throws {AuthError} when token reuse is detected or the token is not allowed
 * @throws {NotFoundError} when the session was not found
 ******************************************************************************************************************/
export async function con_auth_logout(req: Request) {
  const refreshToken = req.body.refreshToken;
  // validate refresh token
  if (typeof refreshToken !== 'string' || refreshToken.length !== REFRESH_TOKEN_LEN) {
    throw new InputError('missing or invalid refresh token');
  }

  // hash the provided refresh token
  const hashedToken = hmacHash(refreshToken);
  const user = await UserModel.findOne({ 'refreshTokens.tokenHash': hashedToken }).exec();

  // token reuse or not found
  if (!user) {
    throw new AuthError('refresh token not allowed');
  }

  // filter out the matching token
  user.refreshTokens = user.refreshTokens.filter(rt => rt.tokenHash !== hashedToken);

  await user.save();

  return { msg: 'Logged out of session' };
}

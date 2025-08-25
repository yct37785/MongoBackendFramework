import { Types } from 'mongoose';
import { IUser, UserModel } from '../models/userModel';
import { hashValue } from '../utils/hash';
import { ConflictError } from '../error/AppError';

/******************************************************************************************************************
 * Creates a new user with the given email and password.
 *
 * @param email - user's email address
 * @param password - user's password in plaintext
 *
 * @returns IUser - created user document
 *
 * @throws {ConflictError} if the email is already registered
 ******************************************************************************************************************/
export async function ser_createUser(email: string, password: string): Promise<IUser> {
  const passwordHash = await hashValue(password);
  const newUser = new UserModel({
    email,
    passwordHash,
    refreshTokens: [],
  });

  try {
    return await newUser.save();
  } catch (err: any) {
    if (err.code === 11000 && err.keyPattern?.email) {
      throw new ConflictError('email already registered');
    }
    throw err;
  }
}

/******************************************************************************************************************
 * Finds a user by email.
 *
 * @param email - user's email address
 *
 * @returns IUser | null - user document if found, otherwise null
 ******************************************************************************************************************/
export async function ser_findUserViaEmail(email: string): Promise<IUser | null> {
  const user = await UserModel.findOne({ email }).exec();
  return user;
}

/******************************************************************************************************************
 * Finds a user by hashed refresh token.
 *
 * @param hashedToken - hashed refresh token
 *
 * @returns IUser | null - user document if found, otherwise null
 ******************************************************************************************************************/
export async function ser_findUserViaRT(hashedToken: string): Promise<IUser | null> {
  const user = await UserModel.findOne({ 'refreshTokens.tokenHash': hashedToken }).exec();
  return user;
}

/******************************************************************************************************************
 * Finds a user by their ObjectId.
 *
 * @param userId - user's ObjectId
 *
 * @returns IUser | null - user document if found, otherwise null
 ******************************************************************************************************************/
export async function ser_findUserViaId(userId: Types.ObjectId): Promise<IUser | null> {
  const user = await UserModel.findById(userId).exec();
  return user;
}

/******************************************************************************************************************
 * Deletes a user only (no cascading deletions).
 * @ATTN Downstream data deletion must be handled by the caller after this function.
 *
 * @param userId - The ObjectId of the user to delete
 ******************************************************************************************************************/
export async function ser_deleteUser(userId: Types.ObjectId): Promise<void> {
  await Promise.all([
    UserModel.deleteOne({ _id: userId }).exec(),
  ]);
}
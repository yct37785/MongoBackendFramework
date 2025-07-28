import { Types } from 'mongoose';
import { IUser, UserModel } from '../models/userModel';
import { hashValue } from '../utils/hash';
import { ConflictError } from '../error/AppError';

/******************************************************************************************************************
 * Create
 ******************************************************************************************************************/
/**
 * create a user
 * @param email - valid email string
 * @param password - plaintext password string
 * @returns user doc
 */
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
 * Read
 ******************************************************************************************************************/
/**
 * find user via email
 * @param email - valid email string
 * @returns user doc, null if not found or unauthorized
 */
export async function ser_findUserViaEmail(email: string): Promise<IUser | null> {
  const user = await UserModel.findOne({ email }).exec();
  return user;
}

/**
 * find user via refresh token
 * @param hashedToken - hash string of the refresh token
 * @returns user doc, null if not found or unauthorized
 */
export async function ser_findUserViaRT(hashedToken: string): Promise<IUser | null> {
  const user = await UserModel.findOne({ 'refreshTokens.tokenHash': hashedToken }).exec();
  return user;
}

/**
 * find user via userId (ObjectId)
 * @param userId - user ObjectId
 * @returns user doc, null if not found
 */
export async function ser_findUserViaId(userId: Types.ObjectId): Promise<IUser | null> {
  const user = await UserModel.findById(userId).exec();
  return user;
}

/******************************************************************************************************************
 * Delete
 ******************************************************************************************************************/
/**
 * delete user ONLY
 * - downstream data deletion must be handled by clients after calling ser_deleteUser
 * @param userId - user to delete
 */
export async function ser_deleteUser(userId: Types.ObjectId): Promise<void> {
  await Promise.all([
    UserModel.deleteOne({ _id: userId }).exec(),
  ]);
}
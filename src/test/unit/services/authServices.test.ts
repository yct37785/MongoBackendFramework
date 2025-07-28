import mongoose, { Types } from 'mongoose';
import { setUpInMemDB } from '../../setupTestDB';
import {
  ser_createUser,
  ser_findUserViaEmail, ser_findUserViaRT, ser_findUserViaId,
  ser_deleteUser
} from '../../../services/authServices';
import { ConflictError } from '../../../error/AppError';
import { UserModel } from '../../../models/userModel';
import { expectMongooseDoc, expectObj } from '../../testUtils';
import { hashValue } from '../../../utils/hash';

setUpInMemDB();

/******************************************************************************************************************
 * Create
 ******************************************************************************************************************/
describe('Create services: auth', () => {
  /*---------------------------------------------------------------------------------------------------------------
   * createUser
   ---------------------------------------------------------------------------------------------------------------*/
  test('createUser should create a user and return it', async () => {
    const user = await ser_createUser('test@example.com', 'Valid@123');
    expect(user).toHaveProperty('_id');
    expect(user.email).toBe('test@example.com');
    expect(user.passwordHash).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash
    expect(user.refreshTokens).toEqual([]);
  });

  test('createUser should throw ConflictError if email already exists', async () => {
    await ser_createUser('duplicate@example.com', 'Valid@123');
    await expect(ser_createUser('duplicate@example.com', 'Another@123')).rejects.toThrow(ConflictError);
  });
});

/******************************************************************************************************************
 * Read
 ******************************************************************************************************************/
describe('Get services: auth', () => {
  /*---------------------------------------------------------------------------------------------------------------
   * findUserViaEmail
   ---------------------------------------------------------------------------------------------------------------*/
  test('findUserViaEmail should return user if email matches', async () => {
    const created = await ser_createUser('findme@example.com', 'Valid@123');
    const fetched = await ser_findUserViaEmail('findme@example.com');
    expectMongooseDoc(fetched);
    expect(fetched?.email).toBe(created.email);
  });

  test('findUserViaEmail returns null if user not found/unauthorized', async () => {
    const user = await ser_findUserViaEmail('missing@example.com');
    expect(user).toBe(null);
  });

  /*---------------------------------------------------------------------------------------------------------------
   * findUserViaRT
   ---------------------------------------------------------------------------------------------------------------*/
  test('findUserViaRT should find user by correct refresh token hash', async () => {
    const user = await ser_createUser('rtuser@example.com', 'Valid@123');
    const tokenHash = await hashValue('somerandomtoken');
    await mongoose.model('User').findByIdAndUpdate(user._id, {
      $push: {
        refreshTokens: {
          tokenHash,
          createdAt: new Date(),
          lastUsedAt: new Date(),
          expiresAt: new Date(Date.now() + 100000),
        },
      },
    }, { new: true });
    // correct hash
    const result = await ser_findUserViaRT(tokenHash);
    expectMongooseDoc(result);
    expect(result?.email).toBe('rtuser@example.com');
  });
  
  test('ser_findUserViaRT returns null if user not found/unauthorized', async () => {
    // non-existent hashes
    let user = await ser_findUserViaRT(await hashValue('nonexistenttoken'));
    expect(user).toBe(null);
    user = await ser_findUserViaRT(await hashValue(''));
    expect(user).toBe(null);
  });

  /*---------------------------------------------------------------------------------------------------------------
   * ser_findUserViaId
   ---------------------------------------------------------------------------------------------------------------*/
  test('ser_findUserViaId returns user when valid ID provided', async () => {
    const user = await ser_createUser('testid@example.com', 'Password@123');
    const foundUser = await ser_findUserViaId(user._id);
    expect(foundUser).not.toBeNull();
    expectMongooseDoc(foundUser);
    expect(foundUser?.email).toBe('testid@example.com');
  });

  test('ser_findUserViaId returns null for unknown ID', async () => {
    const randomId = new Types.ObjectId();
    const foundUser = await ser_findUserViaId(randomId);
    expect(foundUser).toBeNull();
  });
});

/******************************************************************************************************************
 * Delete
 ******************************************************************************************************************/
describe('Delete services: auth', () => {
    let userId: Types.ObjectId;
    let otherUserId: Types.ObjectId;
  
    beforeEach(async () => {
      const user = await ser_createUser('owner@example.com', 'Password@123');
      userId = user._id;
      const otherUser = await ser_createUser('other@example.com', 'Password@123');
      otherUserId = otherUser._id;
    });

    /*---------------------------------------------------------------------------------------------------------------
     * ser_deleteUser
     ---------------------------------------------------------------------------------------------------------------*/
    test('deleteUser deletes user', async () => {
      await ser_deleteUser(userId);
  
      const user = await UserModel.findById(userId);
      expect(user).toBeNull();
  
      const otherUser = await UserModel.findById(otherUserId);
      expect(otherUser).not.toBeNull(); // untouched
    });
});
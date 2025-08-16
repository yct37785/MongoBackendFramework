import mongoose, { Types } from 'mongoose';
import { setUpInMemDB } from '../test/setupTestDB';
import { expectMongooseDoc, genTestEmail, TEST_PW } from '../test/testUtils';
import {
  ser_createUser,
  ser_findUserViaEmail, ser_findUserViaRT, ser_findUserViaId,
  ser_deleteUser
} from './authServices';
import { ConflictError } from '../error/AppError';
import { UserModel } from '../models/userModel';
import { hashValue } from '../utils/hash';

setUpInMemDB();

/******************************************************************************************************************
 * ser_createUser
 ******************************************************************************************************************/
describe('ser_createUser', () => {

  test('ConflictError', async () => {
    const dupEmail = genTestEmail();
    await ser_createUser(dupEmail, TEST_PW);
    await expect(ser_createUser(dupEmail, 'Another@123')).rejects.toThrow(ConflictError);
  });

  test('create user and return created user doc', async () => {
    const sameEmail = genTestEmail();
    const user = await ser_createUser(sameEmail, TEST_PW);
    // check in DB
    const res = await UserModel.findById(user.id);
    if (!res) fail();
    expect(res.email).toBe(sameEmail);
    expect(res.passwordHash).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash
    expect(res.refreshTokens).toEqual([]);
  });
});

/******************************************************************************************************************
 * ser_findUserViaEmail
 ******************************************************************************************************************/
describe('ser_findUserViaEmail', () => {

  test('return null if user not found/unauthorized', async () => {
    const user = await ser_findUserViaEmail(genTestEmail());
    expect(user).toBe(null);
  });

  test('return user doc if email matches', async () => {
    const sameEmail = genTestEmail();
    const created = await ser_createUser(sameEmail, TEST_PW);
    const fetched = await ser_findUserViaEmail(sameEmail);
    expectMongooseDoc(fetched);
    expect(fetched?.email).toBe(created.email);
  });
});

/******************************************************************************************************************
 * ser_findUserViaRT
 ******************************************************************************************************************/
describe('ser_findUserViaRT', () => {

  test('return null if user not found/unauthorized', async () => {
    // non-existent hashes
    let user = await ser_findUserViaRT(await hashValue('nonexistenttoken'));
    expect(user).toBe(null);
    user = await ser_findUserViaRT(await hashValue(''));
    expect(user).toBe(null);
  });

 test('find user by correct refresh token hash, return user doc', async () => {
    const sameEmail = genTestEmail();
    const user = await ser_createUser(sameEmail, TEST_PW);
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
    expect(result?.email).toBe(sameEmail);
  });
});

/******************************************************************************************************************
 * ser_findUserViaId
 ******************************************************************************************************************/
describe('ser_findUserViaRT', () => {

  test('return null if user not found/unauthorized', async () => {
    const randomId = new Types.ObjectId();
    const foundUser = await ser_findUserViaId(randomId);
    expect(foundUser).toBeNull();
  });

  test('find user by correct _id, return user doc', async () => {
    const sameEmail = genTestEmail();
    const user = await ser_createUser(sameEmail, TEST_PW);
    const foundUser = await ser_findUserViaId(user._id);
    expectMongooseDoc(foundUser);
    expect(foundUser?.email).toBe(sameEmail);
  });
});

/******************************************************************************************************************
 * ser_deleteUser
 ******************************************************************************************************************/
describe('ser_deleteUser', () => {
  let userId: Types.ObjectId;
  let otherUserId: Types.ObjectId;

  beforeEach(async () => {
    const user = await ser_createUser(genTestEmail(), TEST_PW);
    userId = user._id;
    const otherUser = await ser_createUser(genTestEmail(), TEST_PW);
    otherUserId = otherUser._id;
  });
  
  test('deletes user specified by userId, other user remains untouched', async () => {
    await ser_deleteUser(userId);

    const user = await UserModel.findById(userId);
    expect(user).toBeNull();

    const otherUser = await UserModel.findById(otherUserId);
    expect(otherUser).not.toBeNull(); // untouched
  });
});

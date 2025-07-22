import mongoose, { Types } from 'mongoose';
import { setUpInMemDB } from '../../../setupTestDB';
import { ser_createUser, ser_createWorkspace, ser_createProject, ser_createSprint } from '../../../../services/CRUD/createServices';
import {
  ser_findUserViaEmail, ser_findUserViaRT, ser_findUserViaId, ser_checkWorkspaceExists,
  ser_fetchAllWorkspacesData, ser_fetchProject, ser_fetchAllProjectsData, ser_fetchSprint
} from '../../../../services/CRUD/getServices';
import { validProjectData, validSprintData } from './utils';
import { expectMongooseDoc, expectObj } from '../../../testUtils';
import { hashValue } from '../../../../utils/hash';

setUpInMemDB();

/******************************************************************************************************************
 * Auth
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
 * Workspace
 ******************************************************************************************************************/
describe('Get services: workspace', () => {
  let userId: Types.ObjectId;
  let workspaceId: Types.ObjectId;
  const otherUserId = new Types.ObjectId();

  beforeEach(async () => {
    const user = await ser_createUser('projuser@example.com', 'Password@123');
    userId = user._id;
    const ws = await ser_createWorkspace(userId, 'Workspace for Projects');
    workspaceId = ws._id;
  });

  /*---------------------------------------------------------------------------------------------------------------
   * ser_checkWorkspaceExists
   ---------------------------------------------------------------------------------------------------------------*/
  test('ser_checkWorkspaceExists returns true when workspace exists and belongs to user', async () => {
    const exists = await ser_checkWorkspaceExists(userId, workspaceId);
    expect(exists).toBe(true);
  });

  test('ser_checkWorkspaceExists returns false for wrong user', async () => {
    const exists = await ser_checkWorkspaceExists(otherUserId, workspaceId);
    expect(exists).toBe(false);
  });

  test('ser_checkWorkspaceExists returns false for non-existent workspace', async () => {
    const fakeWorkspaceId = new Types.ObjectId();
    const exists = await ser_checkWorkspaceExists(userId, fakeWorkspaceId);
    expect(exists).toBe(false);
  });

  /*---------------------------------------------------------------------------------------------------------------
   * fetchAllWorkspacesData
   ---------------------------------------------------------------------------------------------------------------*/
  test('fetchAllWorkspacesData should return all workspaces for user', async () => {
    await ser_createWorkspace(userId, 'W1');
    await ser_createWorkspace(userId, 'W2');
    await ser_createWorkspace(userId, 'W3');
    await ser_createWorkspace(otherUserId, 'W4');
    await ser_createWorkspace(otherUserId, 'W5');
    const list = await ser_fetchAllWorkspacesData(userId);
    expect(list.length).toBe(4);  // include top level created
    list.forEach(ws => {
      expectObj(ws);
      expect(ws.userId.toString()).toBe(userId.toString());
    });
  });

  test('fetchAllWorkspacesData should return empty array for unknown user', async () => {
    const result = await ser_fetchAllWorkspacesData(new Types.ObjectId());
    expect(result).toEqual([]);
  });
});

/******************************************************************************************************************
 * Project
 ******************************************************************************************************************/
describe('Get services: project', () => {
  let userId: Types.ObjectId;
  let workspaceId: Types.ObjectId;

  beforeEach(async () => {
    const user = await ser_createUser('projuser@example.com', 'Password@123');
    userId = user._id;
    const ws = await ser_createWorkspace(userId, 'Workspace for Projects');
    workspaceId = ws._id;
  });

  /* -------------------------------------------------------------------------------------------------------------
   * fetchProject
   ------------------------------------------------------------------------------------------------------------- */
  test('fetchProject returns owned project', async () => {
    const proj = await ser_createProject(userId, workspaceId, validProjectData);
    const result = await ser_fetchProject(userId, proj._id);
    expectMongooseDoc(result);
    expect(result?.title).toBe(validProjectData.title);
    expect(result?.desc).toBe(validProjectData.desc);
    expect(result?.userId.toString()).toBe(userId.toString());
    expect(result?.workspaceId.toString()).toBe(workspaceId.toString());
    expect(result?.defaultSprintColumns).toEqual(validProjectData.defaultSprintColumns);
  });

  test('fetchProject returns null if user or workspace not found/unauthorized', async () => {
    const proj = await ser_createProject(userId, workspaceId, { title: 'Hidden' });
    let res = await ser_fetchProject(new Types.ObjectId(), proj._id);
    expect(res).toBe(null);
    res = await ser_fetchProject(userId, new Types.ObjectId());
    expect(res).toBe(null);
  });

  /* -------------------------------------------------------------------------------------------------------------
   * fetchAllProjectsData
   ------------------------------------------------------------------------------------------------------------- */
  test('fetchAllProjectsData returns projects with selected fields only', async () => {
    await ser_createProject(userId, workspaceId, { title: 'P1', desc: 'D1' });
    await ser_createProject(userId, workspaceId, { title: 'P2', desc: 'D2' });
    // fetch: title
    let results = await ser_fetchAllProjectsData(userId, 'title');
    expect(results.length).toBe(2);
    results.forEach(p => {
      expectObj(p);
      expect(p._id).toBeDefined();
      expect(p._id.toString()).toMatch(/^[a-f\d]{24}$/i);
      expect(typeof p.title).toBe('string');
      expect(p.desc).toBeUndefined();
      expect(p.targetCompletionDate).toBeUndefined();
      expect(p.defaultSprintColumns).toBeUndefined();
    });
    // fetch: desc, targetCompletionDate, defaultSprintColumns only
    results = await ser_fetchAllProjectsData(userId, 'desc targetCompletionDate defaultSprintColumns');
    expect(results.length).toBe(2);
    results.forEach(p => {
      expectObj(p);
      expect(p._id).toBeDefined();
      expect(p._id.toString()).toMatch(/^[a-f\d]{24}$/i);
      expect(p.title).toBeUndefined();
      expect(typeof p.desc).toBe('string');
      expect(p.targetCompletionDate instanceof Date).toBe(true);
      expect(Array.isArray(p.defaultSprintColumns)).toBe(true);
    });
  });

  test('fetchAllProjectsData should return empty array for unknown user', async () => {
    const result = await ser_fetchAllProjectsData(new Types.ObjectId(), 'title');
    expect(result).toEqual([]);
  });
});

/******************************************************************************************************************
 * Sprint: ser_fetchSprint
 ******************************************************************************************************************/
describe('Get services: sprint', () => {
  let userId: mongoose.Types.ObjectId;
  let workspaceId: mongoose.Types.ObjectId;
  let projectId: mongoose.Types.ObjectId;
  let sprintId: mongoose.Types.ObjectId;
  const otherUserId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    const user = await ser_createUser('sprintgetter@example.com', 'Password@123');
    userId = user._id;

    const ws = await ser_createWorkspace(userId, 'WS');
    workspaceId = ws._id;

    const proj = await ser_createProject(userId, workspaceId, validProjectData);
    projectId = proj._id;

    const sprint = await ser_createSprint(userId, projectId, validSprintData);

    sprintId = sprint._id;
  });

  test('ser_fetchSprint returns the sprint document when owned by user', async () => {
    const sprint = await ser_fetchSprint(userId, sprintId);
    expectMongooseDoc(sprint);
    expect(sprint?._id.toString()).toBe(sprintId.toString());
    expect(sprint?.userId.toString()).toBe(userId.toString());
    expect(sprint?.title).toBe(validSprintData.title);
  });

  test('ser_fetchSprint returns null if sprint ID does not exist', async () => {
    const result = await ser_fetchSprint(userId, new mongoose.Types.ObjectId());
    expect(result).toBeNull();
  });

  test('ser_fetchSprint returns null if sprint is not owned by user', async () => {
    const result = await ser_fetchSprint(otherUserId, sprintId);
    expect(result).toBeNull();
  });
});

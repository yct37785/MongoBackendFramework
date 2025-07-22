import { Types } from 'mongoose';
import { setUpInMemDB } from '../../../setupTestDB';
import { ser_createUser, ser_createWorkspace, ser_createProject, ser_createSprint } from '../../../../services/CRUD/createServices';
import { ConflictError } from '../../../../error/AppError';
import { validProjectData, validSprintData } from './utils';

setUpInMemDB();

/******************************************************************************************************************
 * Auth
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
 * Workspace
 ******************************************************************************************************************/
describe('Create services: workspace', () => {
  const userId = new Types.ObjectId();
  /*---------------------------------------------------------------------------------------------------------------
   * createWorkspace
   ---------------------------------------------------------------------------------------------------------------*/
  test('createWorkspace should store valid workspace', async () => {
    const title = 'My Workspace';
    const workspace = await ser_createWorkspace(userId, title);
    expect(workspace._id).toBeDefined();
    expect(workspace.userId.toString()).toBe(userId.toString());
    expect(workspace.title).toBe(title);
  });
});

/******************************************************************************************************************
 * Project
 ******************************************************************************************************************/
describe('Create services: project', () => {
  let userId: Types.ObjectId;
  let workspaceId: Types.ObjectId;

  beforeEach(async () => {
    const user = await ser_createUser('projuser@example.com', 'Password@123');
    userId = user._id;
    const ws = await ser_createWorkspace(userId, 'Workspace for Projects');
    workspaceId = ws._id;
  });

  /* -------------------------------------------------------------------------------------------------------------
    * createProject
    ------------------------------------------------------------------------------------------------------------- */
  test('createProject creates and returns project with full fields', async () => {
    const proj = await ser_createProject(userId, workspaceId, validProjectData);
    expect(proj.title).toBe(validProjectData.title);
    expect(proj.desc).toBe(validProjectData.desc);
    expect(proj.targetCompletionDate!.toISOString()).toBe(validProjectData.targetCompletionDate.toISOString());
    expect(proj.defaultSprintColumns).toEqual(validProjectData.defaultSprintColumns);
    expect(proj.workspaceId.toString()).toBe(workspaceId.toString());
    expect(proj.userId.toString()).toBe(userId.toString());
    expect(proj.createdAt).toBeInstanceOf(Date);
    expect(proj.updatedAt).toBeInstanceOf(Date);
    expect(proj.sprintsUpdatedAt).toBeInstanceOf(Date);
  });

  test('createProject uses defaults when optional fields omitted', async () => {
    const proj = await ser_createProject(userId, workspaceId, { title: 'Bare Minimum' });
    expect(proj.desc).toBe('');
    expect(proj.defaultSprintColumns).toEqual([]);
    expect(proj.targetCompletionDate).toBeInstanceOf(Date);
  });
});

/******************************************************************************************************************
 * Sprint
 ******************************************************************************************************************/
describe('Create services: sprint', () => {
  let userId: Types.ObjectId;
  let workspaceId: Types.ObjectId;
  let projectId: Types.ObjectId;

  beforeEach(async () => {
    const user = await ser_createUser('sprintuser@example.com', 'Password@123');
    userId = user._id;
    const ws = await ser_createWorkspace(userId, 'Sprint Workspace');
    workspaceId = ws._id;
    const proj = await ser_createProject(userId, workspaceId, validProjectData);
    projectId = proj._id;
  });

  test('createSprint should create sprint with full fields', async () => {
    const sprint = await ser_createSprint(userId, projectId, validSprintData);
    expect(sprint._id).toBeDefined();
    expect(sprint.userId.toString()).toBe(userId.toString());
    expect(sprint.projectId.toString()).toBe(projectId.toString());
    expect(sprint.title).toBe(validSprintData.title);
    expect(sprint.desc).toBe(validSprintData.desc);
    expect(sprint.startDate).toBeInstanceOf(Date);
    expect(sprint.dueDate).toBeInstanceOf(Date);
    expect(sprint.columns).toEqual(validSprintData.columns);
  });

  test('createSprint should create sprint when optional fields omitted', async () => {
    const sprint = await ser_createSprint(userId, projectId, { ...validSprintData, desc: undefined });
    expect(sprint._id).toBeDefined();
    expect(sprint.userId.toString()).toBe(userId.toString());
    expect(sprint.projectId.toString()).toBe(projectId.toString());
    expect(sprint.title).toBe(validSprintData.title);
    expect(sprint.desc).toBe('');
    expect(sprint.startDate).toBeInstanceOf(Date);
    expect(sprint.dueDate).toBeInstanceOf(Date);
    expect(sprint.columns).toEqual(validSprintData.columns);
  });
});

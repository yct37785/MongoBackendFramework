import { Types } from 'mongoose';
import { setUpInMemDB } from '../../../setupTestDB';
import { ser_createUser, ser_createWorkspace, ser_createProject, ser_createSprint } from '../../../../services/CRUD/createServices';
import { ser_updateWorkspace, ser_updateProject, ser_updateSprint } from '../../../../services/CRUD/updateServices';
import { validProjectData, validSprintData } from './utils';

setUpInMemDB();

/******************************************************************************************************************
 * Workspace
 ******************************************************************************************************************/
describe('Update services: workspace', () => {
  const userId = new Types.ObjectId();
  const otherUserId = new Types.ObjectId();
  /*---------------------------------------------------------------------------------------------------------------
   * updateWorkspace
   ---------------------------------------------------------------------------------------------------------------*/
  test('updateWorkspace should update title if owned by user', async () => {
    const original = await ser_createWorkspace(userId, 'Original Title');
    expect(original.title).toBe('Original Title');
    expect(original.userId.toString()).toBe(userId.toString());
    
    const updated = await ser_updateWorkspace(userId, original._id, 'Updated Title');
    if (!updated) fail('Workspace failed to update');
    expect(updated.title).toBe('Updated Title');
    expect(updated.userId.toString()).toBe(userId.toString());
  });

  test('updateWorkspace returns null if user or workspace not found/unauthorized', async () => {
    const ws = await ser_createWorkspace(userId, 'Title');
    let result = await ser_updateWorkspace(otherUserId, ws._id, 'Hack');
    expect(result).toBe(null);
    const ws2 = await ser_createWorkspace(otherUserId, 'Title');
    result = await ser_updateWorkspace(userId, ws2._id, 'Hack');
    expect(result).toBe(null);
    result = await ser_updateWorkspace(new Types.ObjectId(), ws._id, 'test');
    expect(result).toBe(null);
  });
});

/******************************************************************************************************************
 * Project
 ******************************************************************************************************************/
describe('Update services: project', () => {
  let userId: Types.ObjectId;
  let workspaceId: Types.ObjectId;

  beforeEach(async () => {
    const user = await ser_createUser('projuser@example.com', 'Password@123');
    userId = user._id;
    const ws = await ser_createWorkspace(userId, 'Workspace for Projects');
    workspaceId = ws._id;
  });

  /* -------------------------------------------------------------------------------------------------------------
   * updateProject
   ------------------------------------------------------------------------------------------------------------- */
  test('updateProject modifies only specified fields', async () => {
    const proj = await ser_createProject(userId, workspaceId, validProjectData);
    const updated = await ser_updateProject(userId, proj._id, { title: 'Updated Title' });
    if (!updated) fail('Project failed to update');
    expect(updated.title).toBe('Updated Title');
    expect(updated.desc).toBe(validProjectData.desc);
  });

  test('updateProject allows updating all fields', async () => {
    const proj = await ser_createProject(userId, workspaceId, validProjectData);
    const updates = {
      title: 'New Title',
      desc: 'Updated Desc',
      targetCompletionDate: new Date(Date.now() + 999999),
      defaultSprintColumns: ['X', 'Y'],
    };

    const updated = await ser_updateProject(userId, proj._id, updates);
    if (!updated) fail('Project failed to update');
    expect(updated.title).toBe(updates.title);
    expect(updated.desc).toBe(updates.desc);
    expect(updated.defaultSprintColumns).toEqual(updates.defaultSprintColumns);
    expect(updated.targetCompletionDate?.toISOString()).toBe(updates.targetCompletionDate.toISOString());
  });

  test('updateProject returns null if user or project not found/unauthorized', async () => {
    const proj = await ser_createProject(userId, workspaceId, { title: 'Secure' });
    let result = await ser_updateProject(new Types.ObjectId(), proj._id, { title: 'Hacked' });
    expect(result).toBe(null);
    result = await ser_updateProject(userId, new Types.ObjectId(), { title: 'Not Found' });
    expect(result).toBe(null);
  });
});

/******************************************************************************************************************
 * Sprint
 ******************************************************************************************************************/
describe('Update services: sprint', () => {
  let userId: Types.ObjectId;
  let projectId: Types.ObjectId;
  let sprintId: Types.ObjectId;

  beforeEach(async () => {
    const user = await ser_createUser('updatesprint@example.com', 'Password@123');
    userId = user._id;
    const ws = await ser_createWorkspace(userId, 'WS');
    const proj = await ser_createProject(userId, ws._id, validProjectData);
    projectId = proj._id;
    const sprint = await ser_createSprint(userId, projectId, validSprintData);
    sprintId = sprint._id;
  });

  test('updateSprint updates specified fields', async () => {
    const updated = await ser_updateSprint(userId, sprintId, { title: 'New Sprint Title' });
    expect(updated?.title).toBe('New Sprint Title');
    expect(updated?.userId.toString()).toBe(userId.toString());
  });

  test('updateSprint allows full field updates', async () => {
    const updates = {
      title: 'Updated Sprint',
      desc: 'Updated Desc',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 123456),
      columns: ['A', 'B'],
    };
    const updated = await ser_updateSprint(userId, sprintId, updates);
    expect(updated?.title).toBe(updates.title);
    expect(updated?.desc).toBe(updates.desc);
    expect(updated?.columns).toEqual(updates.columns);
  });

  test('updateSprint returns null if unauthorized', async () => {
    const result = await ser_updateSprint(new Types.ObjectId(), sprintId, { title: 'Hack' });
    expect(result).toBeNull();
  });

  test('updateSprint returns null for unknown sprintId', async () => {
    const result = await ser_updateSprint(userId, new Types.ObjectId(), { title: 'Hack' });
    expect(result).toBeNull();
  });
});

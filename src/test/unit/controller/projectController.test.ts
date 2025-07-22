import { setUpInMemDB } from '../../setupTestDB';
import { con_workspace_create } from '../../../controller/workspaceController';
import { con_project_create, con_project_update, con_project_get, 
  con_project_get_sprintsUpdatedAt, con_project_get_allTitles } from '../../../controller/projectController';
import { InputError, PermissionError } from '../../../error/AppError';
import { callConFn, expectString, expectDate } from '../../testUtils';
import { DESC_MAX_LEN } from '../../../consts';
import { Types } from 'mongoose';

setUpInMemDB();

const userId = new Types.ObjectId();
let workspaceId = '';
beforeEach(async () => {
  const result = await callConFn(con_workspace_create, userId, { title: 'test123' });
  workspaceId = result.id;
});

/******************************************************************************************************************
 * con_project_create
 ******************************************************************************************************************/
describe('projectController: con_project_create', () => {
  const basePayload = {
    title: 'test title',
    desc: 'test desc',
    targetCompletionDate: new Date().toISOString(),
    defaultSprintColumns: ['test1', 'test2', 'test3'],
    extraData: 'test' // test unexpected extra data
  };

  test('invalid input', async () => {
    await expect(callConFn(con_project_create, userId, { workspaceId, title: '' })).rejects.toThrow(InputError);
    await expect(callConFn(con_project_create, userId, { workspaceId, title: 'asd1', desc: 'a'.repeat(DESC_MAX_LEN + 1) })).rejects.toThrow(InputError);
    await expect(callConFn(con_project_create, userId, { workspaceId, title: 'asd2', targetCompletionDate: 'invalid-datestr' })).rejects.toThrow(InputError);
    // this is actually valid
    await expect(callConFn(con_project_create, userId, { workspaceId, title: 'asd3', defaultSprintColumns: null })).resolves.not.toThrow();
  });

  test('permission error', async () => {
    const invalidWorkspaceId = new Types.ObjectId().toString();
    await expect(callConFn(con_project_create, userId, {  ...basePayload, workspaceId: invalidWorkspaceId })).rejects.toThrow(PermissionError);
  });

  test('success', async () => {
    const result = await callConFn(con_project_create, userId, { ...basePayload, workspaceId });
    if (!result) fail('result should be defined');
    expectString(result.id);
    expect(result.title === basePayload.title).toBeTruthy();
    expect(result.desc === basePayload.desc).toBeTruthy();
    expect(result.targetCompletionDate.toISOString() === basePayload.targetCompletionDate).toBeTruthy();
    expect(Array.isArray(result.defaultSprintColumns)).toBeTruthy();
    expect(result.defaultSprintColumns.join() === basePayload.defaultSprintColumns.join()).toBeTruthy();
    expectDate(result.createdAt);
    expectDate(result.updatedAt);
  });
});

/******************************************************************************************************************
 * con_project_update
 ******************************************************************************************************************/
describe('projectController: con_project_update', () => {
  let projectId = '';

  beforeEach(async () => {
    const project = await callConFn(con_project_create, userId, { workspaceId, title: 'Initial Project' });
    projectId = project.id;
  });

  test('invalid input', async () => {
    await expect(callConFn(con_project_update, userId, { workspaceId, title: '' }, { id: projectId })).rejects.toThrow(InputError);
    // bad description and bad date
    await expect(callConFn(con_project_update, userId, { desc: 'x'.repeat(DESC_MAX_LEN + 1) }, { id: projectId })).rejects.toThrow(InputError);
    await expect(callConFn(con_project_update, userId, { targetCompletionDate: 'not-a-date' }, { id: projectId })).rejects.toThrow(InputError);
    await expect(callConFn(con_project_update, userId, { defaultSprintColumns: 'not-an-array' }, { id: projectId })).rejects.toThrow(InputError);
    // bad projectId
    await expect(callConFn(con_project_update, userId, { title: 'Test' }, { id: 'invalid-id' })).rejects.toThrow(InputError);
  });

  test('permission error', async () => {
    const otherProjectId = new Types.ObjectId().toString();
    await expect(callConFn(con_project_update, userId, { title: 'New' }, { id: otherProjectId })).rejects.toThrow(PermissionError);
  });

  test('success with partial update', async () => {
    const result = await callConFn(con_project_update, userId, { title: 'Updated Title' }, { id: projectId });
    expect(result.title).toBe('Updated Title');
    expectString(result.id);
    expectDate(result.updatedAt);
  });
});

/******************************************************************************************************************
 * con_project_get
 ******************************************************************************************************************/
describe('projectController: con_project_get', () => {
  let projectId = '';

  beforeEach(async () => {
    const project = await callConFn(con_project_create, userId, { workspaceId, title: 'My Project' });
    projectId = project.id;
  });

  test('invalid input', async () => {
    await expect(callConFn(con_project_get, userId, {}, { id: 'invalid-object-id' })).rejects.toThrow(InputError);
  });

  test('permission error', async () => {
    const otherProjectId = new Types.ObjectId().toString();
    await expect(callConFn(con_project_get, userId, {}, { id: otherProjectId })).rejects.toThrow(PermissionError);
  });

  test('success', async () => {
    const result = await callConFn(con_project_get, userId, {}, { id: projectId });
    expect(result.title).toBe('My Project');
    expectString(result.id);
    expectDate(result.createdAt);
  });
});

/******************************************************************************************************************
 * con_project_get_sprintsUpdatedAt
 ******************************************************************************************************************/
describe('projectController: con_project_get_sprintsUpdatedAt', () => {
  let projectId = '';

  beforeEach(async () => {
    const project = await callConFn(con_project_create, userId, { workspaceId, title: 'Project' });
    projectId = project.id;
  });

  test('invalid input', async () => {
    await expect(callConFn(con_project_get_sprintsUpdatedAt, userId, {}, { id: 'not-an-objectid' })).rejects.toThrow(InputError);
  });

  test('permission error', async () => {
    const otherProjectId = new Types.ObjectId().toString();
    await expect(callConFn(con_project_get_sprintsUpdatedAt, userId, {}, { id: otherProjectId })).rejects.toThrow(PermissionError);
  });

  test('success', async () => {
    const result = await callConFn(con_project_get_sprintsUpdatedAt, userId, {}, { id: projectId });
    expectDate(result.sprintsUpdatedAt);
  });
});

/******************************************************************************************************************
 * con_project_get_allTitles
 ******************************************************************************************************************/
describe('projectController: con_project_get_allTitles', () => {
  test('returns empty array when no workspaces', async () => {
    const result = await callConFn(con_project_get_allTitles, new Types.ObjectId, {});
    expect(result).toEqual([]);
  });

  test('returns correct structure when projects exist', async () => {
    await callConFn(con_project_create, userId, { workspaceId, title: 'Project A' });
    await callConFn(con_project_create, userId, { workspaceId, title: 'Project B' });

    const result = await callConFn(con_project_get_allTitles, userId, {});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    const first = result[0];
    expect(first.workspaceId).toBe(workspaceId);
    expect(Array.isArray(first.projects)).toBe(true);
  });
});

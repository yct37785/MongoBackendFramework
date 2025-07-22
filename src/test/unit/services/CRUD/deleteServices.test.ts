import { Types } from 'mongoose';
import { setUpInMemDB } from '../../../setupTestDB';
import {
  ser_createUser, ser_createWorkspace, ser_createProject, ser_createSprint
} from '../../../../services/CRUD/createServices';
import {
  ser_deleteUser, ser_deleteWorkspace, ser_deleteProject, ser_deleteSprint
} from '../../../../services/CRUD/deleteServices';
import { UserModel } from '../../../../models/userModel';
import { WorkspaceModel } from '../../../../models/workspaceModel';
import { ProjectModel } from '../../../../models/projectModel';
import { SprintModel } from '../../../../models/sprintModel';
import { validProjectData, validSprintData } from './utils';

setUpInMemDB();

describe('Delete services: cascading behavior', () => {
  let userId: Types.ObjectId;
  let workspaceId: Types.ObjectId;
  let projectId: Types.ObjectId;
  let sprintId: Types.ObjectId;
  let otherUserId: Types.ObjectId;

  beforeEach(async () => {
    const user = await ser_createUser('owner@example.com', 'Password@123');
    userId = user._id;
    const ws = await ser_createWorkspace(userId, 'Workspace');
    workspaceId = ws._id;
    const proj = await ser_createProject(userId, workspaceId, validProjectData);
    projectId = proj._id;
    const sprint = await ser_createSprint(userId, projectId, validSprintData);
    sprintId = sprint._id;

    const otherUser = await ser_createUser('other@example.com', 'Password@123');
    otherUserId = otherUser._id;
    await ser_createWorkspace(otherUserId, 'Other Workspace');
    await ser_createProject(otherUserId, workspaceId, { title: 'Other Project' });
  });

  /*---------------------------------------------------------------------------------------------------------------
   * ser_deleteUser
   ---------------------------------------------------------------------------------------------------------------*/
  test('deleteUser deletes user and all downstream data', async () => {
    await ser_deleteUser(userId);

    const user = await UserModel.findById(userId);
    const workspaces = await WorkspaceModel.find({ userId });
    const projects = await ProjectModel.find({ userId });
    const sprints = await SprintModel.find({ userId });

    expect(user).toBeNull();
    expect(workspaces.length).toBe(0);
    expect(projects.length).toBe(0);
    expect(sprints.length).toBe(0);

    const otherUser = await UserModel.findById(otherUserId);
    expect(otherUser).not.toBeNull(); // untouched
  });

  /*---------------------------------------------------------------------------------------------------------------
   * ser_deleteWorkspace
   ---------------------------------------------------------------------------------------------------------------*/
  test('deleteWorkspace deletes owned workspace, its projects, its sprints', async () => {
    await ser_deleteWorkspace(userId, workspaceId);

    const ws = await WorkspaceModel.findOne({ _id: workspaceId });
    const projs = await ProjectModel.find({ workspaceId });
    const sprints = await SprintModel.find({ projectId });

    expect(ws).toBeNull();
    expect(projs.length).toBe(0);
    expect(sprints.length).toBe(0);
  });

  test('deleteWorkspace does not delete if user does not own workspace', async () => {
    await ser_deleteWorkspace(otherUserId, workspaceId);

    const ws = await WorkspaceModel.findById(workspaceId);
    expect(ws).not.toBeNull();
  });

  /*---------------------------------------------------------------------------------------------------------------
   * ser_deleteProject
   ---------------------------------------------------------------------------------------------------------------*/
  test('deleteProject deletes owned project and its sprints', async () => {
    await ser_deleteProject(userId, projectId);

    const proj = await ProjectModel.findById(projectId);
    const sprints = await SprintModel.find({ projectId });

    expect(proj).toBeNull();
    expect(sprints.length).toBe(0);
  });

  test('deleteProject does not delete if user does not own project', async () => {
    await ser_deleteProject(otherUserId, projectId);

    const proj = await ProjectModel.findById(projectId);
    expect(proj).not.toBeNull();
  });

  /*---------------------------------------------------------------------------------------------------------------
   * ser_deleteSprint
   ---------------------------------------------------------------------------------------------------------------*/
  test('deleteSprint deletes owned sprint only', async () => {
    await ser_deleteSprint(userId, sprintId);

    const sprint = await SprintModel.findById(sprintId);
    expect(sprint).toBeNull();
  });

  test('deleteSprint does not delete if user does not own sprint', async () => {
    await ser_deleteSprint(otherUserId, sprintId);

    const sprint = await SprintModel.findById(sprintId);
    expect(sprint).not.toBeNull();
  });
});

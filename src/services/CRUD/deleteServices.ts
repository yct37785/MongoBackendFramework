import { Types } from 'mongoose';
import { UserModel } from '../../models/userModel';
import { WorkspaceModel } from '../../models/workspaceModel';
import { ProjectModel } from '../../models/projectModel';
import { SprintModel } from '../../models/sprintModel';

/******************************************************************************************************************
 * Auth
 ******************************************************************************************************************/
/**
 * delete user and all associated downstream data (workspaces, projects, sprints, tasks)
 * @param userId - user to delete
 */
export async function ser_deleteUser(userId: Types.ObjectId): Promise<void> {
  await Promise.all([
    UserModel.deleteOne({ _id: userId }).exec(),
    WorkspaceModel.deleteMany({ userId }).exec(),
    ProjectModel.deleteMany({ userId }).exec(),
    SprintModel.deleteMany({ userId }).exec(),
  ]);
}

/******************************************************************************************************************
 * Workspace
 ******************************************************************************************************************/
/**
 * delete workspace and all associated downstream data (projects, sprints, tasks)
 * @param userId - owning user
 * @param workspaceId - workspace to delete
 */
export async function ser_deleteWorkspace(userId: Types.ObjectId, workspaceId: Types.ObjectId): Promise<void> {
  // delete the workspace
  const workspace = await WorkspaceModel.findOneAndDelete({ _id: workspaceId, userId });
  if (!workspace) return;

  // find all projects owned by user under this workspace
  const projects = await ProjectModel.find({ workspaceId, userId }).select('_id').lean();
  const projectIds = projects.map(p => p._id);

  // run project deletion and sprint deletion in parallel (if any projects exist)
  if (projectIds.length > 0) {
    await Promise.all([
      ProjectModel.deleteMany({ workspaceId }),
      SprintModel.deleteMany({ projectId: { $in: projectIds }, userId }),
    ]);
  }
}

/******************************************************************************************************************
 * Project
 ******************************************************************************************************************/
/**
 * delete project and all associated downstream data (sprints, tasks)
 * @param userId - owning user
 * @param projectId - project to delete
 */
export async function ser_deleteProject(userId: Types.ObjectId, projectId: Types.ObjectId): Promise<void> {
  await Promise.all([
    ProjectModel.deleteOne({ _id: projectId, userId }).exec(),
    SprintModel.deleteMany({ userId, projectId }).exec(),
  ]);
}

/******************************************************************************************************************
 * Sprint
 ******************************************************************************************************************/
/**
 * delete sprint and all associated downstream data (tasks)
 * @param userId - owning user
 * @param sprintId - sprint to delete
 */
export async function ser_deleteSprint(userId: Types.ObjectId, sprintId: Types.ObjectId): Promise<void> {
  await SprintModel.deleteOne({ _id: sprintId, userId }).exec();
}

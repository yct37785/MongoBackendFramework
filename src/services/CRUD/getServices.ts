import { Types } from 'mongoose';
import { IUser, UserModel } from '../../models/userModel';
import { IWorkspace, WorkspaceModel } from '../../models/workspaceModel';
import { IProject, ProjectModel } from '../../models/projectModel';
import { ISprint, SprintModel } from '../../models/sprintModel';

/******************************************************************************************************************
 * Auth
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
 * Workspace
 ******************************************************************************************************************/
/**
 * Check if a workspace exists and is owned by the given userId.
 * 
 * @param userId - ID of the user
 * @param workspaceId - ID of the workspace to check
 * @returns true if workspace exists and is owned by user, false otherwise
 */
export async function ser_checkWorkspaceExists(
  userId: Types.ObjectId,
  workspaceId: Types.ObjectId
): Promise<boolean> {
  const count = await WorkspaceModel.countDocuments({ _id: workspaceId, userId }).exec();
  return count > 0;
}

/**
 * fetch all workspaces (lean data) owned by given userId
 * @param userId - owning user
 * @returns list of workspaces (lean) found
 */
export async function ser_fetchAllWorkspacesData(
  userId: Types.ObjectId,
): Promise<any[]> {
  return await WorkspaceModel.find({ userId }).sort({ updatedAt: -1 }).lean().exec();
}

/******************************************************************************************************************
 * Project
 ******************************************************************************************************************/
/**
 * fetch a project (doc) owned by given userId
 * @param userId - owning user
 * @param projectId - ID of project to update
 * @returns project doc, null if not found or unauthorized
 */
export async function ser_fetchProject(
  userId: Types.ObjectId,
  projectId: Types.ObjectId,
): Promise<IProject | null> {
  const project = await ProjectModel.findOne({ _id: projectId, userId }).exec();
  return project;
}

/**
 * fetch all projects (lean data) owned by given userId
 * @param userId - owning user
 * @param fields - space-separated field names to select
 * @returns list of projects (lean) found 
 */
export async function ser_fetchAllProjectsData(
  userId: Types.ObjectId,
  fields: string
): Promise<any[]> {
  const projects = await ProjectModel.find({ userId }, fields).sort({ updatedAt: -1 }).lean().exec();
  return projects;
}

/******************************************************************************************************************
 * Sprint
 ******************************************************************************************************************/
/**
 * fetch a sprint (doc) owned by given userId
 * @param userId - ObjectId of the user who must own the sprint
 * @param sprintId - ObjectId of the sprint to fetch
 * @returns sprint doc, null if not found or unauthorized
 */
export async function ser_fetchSprint(
  userId: Types.ObjectId,
  sprintId: Types.ObjectId
): Promise<any | null> {
  return await SprintModel.findOne({ _id: sprintId, userId }).exec();
}

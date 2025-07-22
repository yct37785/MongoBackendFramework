import { Types } from 'mongoose';
import { IUser, UserModel } from '../../models/userModel';
import { IWorkspace, WorkspaceModel } from '../../models/workspaceModel';
import { IProject, ProjectModel } from '../../models/projectModel';
import { ISprint, SprintModel } from '../../models/sprintModel';
import { hashValue } from '../../utils/hash';
import { ConflictError } from '../../error/AppError';

/******************************************************************************************************************
 * Auth
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
 * Workspace
 ******************************************************************************************************************/
/**
 * create a workspace owned by given userId
 * @param userId - owning user
 * @param title - workspace title string
 * @returns workspace doc
 */
export async function ser_createWorkspace(userId: Types.ObjectId, title: string): Promise<IWorkspace> {
  const doc = new WorkspaceModel({ userId, title });
  return await doc.save();
}

/******************************************************************************************************************
 * Project
 ******************************************************************************************************************/
/**
 * create a project owned by given userId and associated with given workspaceId
 * @param userId - owning user
 * @param workspaceId - owning workspace
 * @param data - project fields: title, desc, targetCompletionDate, defaultSprintColumns
 * @returns project doc
 */
export async function ser_createProject(
  userId: Types.ObjectId,
  workspaceId: Types.ObjectId,
  data: {
    title: string;
    desc?: string;
    targetCompletionDate?: Date;
    defaultSprintColumns?: Array<string>;
  }
): Promise<IProject> {
  const title = data.title;
  const desc = data.desc ?? '';
  const targetCompletionDate = data.targetCompletionDate ?? undefined;
  const defaultSprintColumns = data.defaultSprintColumns ?? [];

  const doc = new ProjectModel({
    userId,
    workspaceId,
    title,
    desc,
    targetCompletionDate,
    defaultSprintColumns,
  });

  return await doc.save();
}

/******************************************************************************************************************
 * Sprint
 ******************************************************************************************************************/
/**
 * create a project owned by given userId and associated with given projectId
 * @param userId - owning user
 * @param projectId - owning project
 * @param data - full sprint data
 * @returns sprint doc
 */
export async function ser_createSprint(
  userId: Types.ObjectId,
  projectId: Types.ObjectId,
  data: {
    title: string;
    desc?: string;
    startDate: Date;
    dueDate: Date;
    columns: string[];
  }
): Promise<ISprint> {
  const { title, desc = '', startDate, dueDate, columns } = data;

  const sprint = new SprintModel({
    userId,
    projectId,
    title,
    desc,
    startDate,
    dueDate,
    columns,
  });

  return await sprint.save();
}

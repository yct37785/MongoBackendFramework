import { Types } from 'mongoose';
import { IWorkspace, WorkspaceModel } from '../../models/workspaceModel';
import { IProject, ProjectModel } from '../../models/projectModel';
import { ISprint, SprintModel } from '../../models/sprintModel';

/******************************************************************************************************************
 * Workspace
 ******************************************************************************************************************/
/**
 * update workspace values
 * @param userId - owning user
 * @param workspaceId - workspace to update
 * @param title - new title string
 * @returns updated workspace doc, null if not found or unauthorized
 */
export async function ser_updateWorkspace(
  userId: Types.ObjectId,
  workspaceId: Types.ObjectId,
  title: string
): Promise<IWorkspace | null> {

  const updated = await WorkspaceModel.findOneAndUpdate(
    { _id: workspaceId, userId },
    { $set: { title } },
    {
      new: true,
      runValidators: true,
      context: 'query',
    }
  );

  return updated;
}

/******************************************************************************************************************
 * Project
 ******************************************************************************************************************/
/**
 * update project values
 * @param userId - owning user
 * @param projectId - project to update
 * @param updates - partial values to update
 * @returns updated project doc, null if not found or unauthorized
 */
export async function ser_updateProject(
  userId: Types.ObjectId,
  projectId: Types.ObjectId,
  updates: {
    title?: string;
    desc?: string;
    targetCompletionDate?: Date;
    defaultSprintColumns?: Array<string>;
  }
): Promise<IProject | null> {

  const updatePayload: Partial<IProject> = {};
  if (updates.title !== undefined) updatePayload.title = updates.title;
  if (updates.desc !== undefined) updatePayload.desc = updates.desc;
  if (updates.targetCompletionDate !== undefined)
    updatePayload.targetCompletionDate = updates.targetCompletionDate;
  if (updates.defaultSprintColumns !== undefined)
    updatePayload.defaultSprintColumns = updates.defaultSprintColumns;

  const updated = await ProjectModel.findOneAndUpdate(
    { _id: projectId, userId },
    { $set: updatePayload },
    {
      new: true,
      runValidators: true,
      context: 'query',
    }
  );

  return updated;
}

/******************************************************************************************************************
 * Sprint
 ******************************************************************************************************************/
/**
 * update sprint values
 * @param userId - owning user
 * @param sprintId - sprint to update
 * @param updates - partial values to update
 * @returns updated sprint doc, null if not found or unauthorized
 */
export async function ser_updateSprint(
  userId: Types.ObjectId,
  sprintId: Types.ObjectId,
  updates: {
    title?: string;
    desc?: string;
    startDate?: Date;
    dueDate?: Date;
    columns?: string[];
  }
): Promise<ISprint | null> {
  const updatePayload: Partial<ISprint> = {};

  if (updates.title !== undefined) updatePayload.title = updates.title;
  if (updates.desc !== undefined) updatePayload.desc = updates.desc;
  if (updates.startDate !== undefined) updatePayload.startDate = updates.startDate;
  if (updates.dueDate !== undefined) updatePayload.dueDate = updates.dueDate;
  if (updates.columns !== undefined) updatePayload.columns = updates.columns;

  const updated = await SprintModel.findOneAndUpdate(
    { _id: sprintId, userId },
    { $set: updatePayload },
    {
      new: true,
      runValidators: true,
      context: 'query',
    }
  );

  return updated;
}
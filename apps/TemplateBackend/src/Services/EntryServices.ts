import mongoose from 'mongoose';
import { ser_deleteUser } from 'framework/services';
import { IEntry, EntryModel } from '../Models/EntryModel';

/******************************************************************************************************************
 * Creates an entry owned by the user.
 *
 * @param userId - owning user
 * @param title - entry title
 * @param content - entry content
 *
 * @returns IEntry - created entry document
 ******************************************************************************************************************/
export async function ser_createEntry(userId: mongoose.Types.ObjectId, title: string, content: string): Promise<IEntry> {
  const doc = new EntryModel({ userId, title, content });
  return await doc.save();
}

/******************************************************************************************************************
 * Fetches an entry owned by the user.
 *
 * @param userId - owning user
 * @param entryId - entry to fetch
 *
 * @returns IEntry | null - entry document if found, otherwise null
 ******************************************************************************************************************/
export async function ser_fetchEntry(
  userId: mongoose.Types.ObjectId,
  entryId: mongoose.Types.ObjectId,
): Promise<IEntry | null> {
  const entry = await EntryModel.findOne({ _id: entryId, userId }).exec();
  return entry;
}

/******************************************************************************************************************
 * Updates an entry owned by the user.
 *
 * @param userId - owning user
 * @param entryId - entry to update
 * @param updates - partial fields:
 *   - `title?`: string
 *   - `content?`: string
 *
 * @returns IEntry | null - updated entry document, otherwise null
 ******************************************************************************************************************/
export async function ser_updateEntry(
  userId: mongoose.Types.ObjectId,
  entryId: mongoose.Types.ObjectId,
  updates: {
    title?: string;
    content?: string;
  }
): Promise<IEntry | null> {
  const updatePayload: Partial<IEntry> = {};
  if (updates.title !== undefined) updatePayload.title = updates.title;
  if (updates.content !== undefined) updatePayload.content = updates.content;

  const updated = await EntryModel.findOneAndUpdate(
    { _id: entryId, userId },
    { $set: updatePayload },
    {
      new: true,
      context: 'query',
    }
  );

  return updated;
}

/******************************************************************************************************************
 * Delete an entry.
 *
 * @param userId - owning user
 * @param entryId - entry to delete
 ******************************************************************************************************************/
export async function ser_deleteEntry(userId: mongoose.Types.ObjectId, entryId: mongoose.Types.ObjectId): Promise<void> {
  await EntryModel.deleteOne({ _id: entryId, userId }).exec();
}

/******************************************************************************************************************
 * Deletes a user and all associated downstream data (entries).
 *
 * @param userId - user to delete
 ******************************************************************************************************************/
export async function ser_deleteUserAndData(userId: mongoose.Types.ObjectId): Promise<void> {
  await Promise.all([
    ser_deleteUser(userId),
    EntryModel.deleteMany({ userId }).exec(),
  ]);
}

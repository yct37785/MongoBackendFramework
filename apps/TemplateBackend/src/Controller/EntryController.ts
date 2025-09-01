import { Request } from 'express';
import { EntryModel } from '../Models/EntryModel';
import { NotFoundError } from 'framework/error';
import { sanitizeObjectId } from 'framework/utils';
import { TITLE_MIN_LEN, TITLE_MAX_LEN, CONTENT_MIN_LEN, CONTENT_MAX_LEN } from '../Const';
import { sanitizeStringField } from 'framework/utils';

/******************************************************************************************************************
 * Creates a new entry for the authenticated user.
 *
 * @param req - Express request containing:
 *   - `user.userId`: string - authenticated user id
 *   - `body.title`: string - entry title
 *   - `body.content`: string - entry content
 *
 * @returns any:
 *   - `msg`: string - confirmation message that entry is created
 *   - `entryId`: string - entry id
 *
 * @throws {InputError} if title/content are invalid
 ******************************************************************************************************************/
export async function con_entry_create(req: Request) {
  const userId = sanitizeObjectId(req.user?.userId);
  const title = sanitizeStringField(req.body.title, TITLE_MIN_LEN, TITLE_MAX_LEN, 'title');
  const content = sanitizeStringField(req.body.content, CONTENT_MIN_LEN, CONTENT_MAX_LEN, 'content');

  const newEntry = new EntryModel({ userId, title, content });
  await newEntry.save();

  return { msg: 'Entry created successfully', entryId: newEntry._id.toString() };
}

/******************************************************************************************************************
 * Retrieves an entry by id. Entry must belong to the authenticated user.
 *
 * @param req - Express request containing:
 *   - `user.userId`: string - authenticated user id
 *   - `params.id`: string - entry id
 *
 * @returns any:
 *   - `title`: string - entry content
 *   - `content`: string - entry content
 *
 * @throws {NotFoundError} if entry is not found or not owned by user
 ******************************************************************************************************************/
export async function con_entry_get(req: Request) {
  const userId = sanitizeObjectId(req.user?.userId);
  const entryId = sanitizeObjectId(req.params.id);

  const entry = await EntryModel.findOne({ _id: entryId, userId }).exec();
  if (!entry) throw new NotFoundError('entry not found/unauthorized');

  return {
    title: entry.title,
    content: entry.content
  };
}

/******************************************************************************************************************
 * Updates an existing entry. Entry must belong to the authenticated user.
 *
 * @param req - Express request containing:
 *   - `user.userId`: string - authenticated user id
 *   - `params.id`: string - entry id
 *   - `body.title?`: string - new title
 *   - `body.content?`: string - new content
 *
 * @returns any:
 *   - `msg`: string - confirmation message
 *
 * @throws {InputError} if provided title/content are invalid
 * @throws {NotFoundError} if entry is not found or not owned by user
 ******************************************************************************************************************/
export async function con_entry_update(req: Request) {
  const userId = sanitizeObjectId(req.user?.userId);
  const entryId = sanitizeObjectId(req.params.id);

  const entry = await EntryModel.findOne({ _id: entryId, userId }).exec();
  if (!entry) throw new NotFoundError('entry not found/unauthorized');

  if (req.body.title !== undefined) {
    entry.title = sanitizeStringField(req.body.title, TITLE_MIN_LEN, TITLE_MAX_LEN, 'title');
  }
  if (req.body.content !== undefined) {
    entry.content = sanitizeStringField(req.body.content, CONTENT_MIN_LEN, CONTENT_MAX_LEN, 'content');
  }

  await entry.save();
  return { msg: 'Entry updated successfully' };
}

/******************************************************************************************************************
 * Deletes an entry. Entry must belong to the authenticated user.
 *
 * @param req - Express request containing:
 *   - `user.userId`: string - authenticated user id
 *   - `params.id`: string - entry id
 *
 * @returns any:
 *   - `msg`: string - confirmation message
 *
 * @throws {NotFoundError} if entry is not found or not owned by user
 ******************************************************************************************************************/
export async function con_entry_delete(req: Request) {
  const userId = sanitizeObjectId(req.user?.userId);
  const entryId = sanitizeObjectId(req.params.id);

  const result = await EntryModel.deleteOne({ _id: entryId, userId }).exec();
  if (result.deletedCount === 0) {
    throw new NotFoundError('entry not found/unauthorized');
  }

  return { msg: 'Entry deleted successfully' };
}

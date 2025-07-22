import { Types } from 'mongoose';
import { setUpInMemDB } from '../../setupTestDB';
import { con_workspace_create } from '../../../controller/workspaceController';
import { InputError } from '../../../error/AppError';
import { callConFn, expectString, expectDate } from '../../testUtils';

setUpInMemDB();

let userId = new Types.ObjectId();

/******************************************************************************************************************
 * con_workspace_create
 ******************************************************************************************************************/
describe('workspaceController: con_workspace_create', () => {

  test('invalid input', async () => {
    await expect(callConFn(con_workspace_create, userId, { title: '' })).rejects.toThrow(InputError);
  });

  test('success', async () => {
    const title = `Title ${Date.now()}`;
    const result = await callConFn(con_workspace_create, userId, { title });
    if (!result) fail('result should be defined');
    expectString(result.id);
    expectString(result.title);
    expectDate(result.createdAt);
    expectDate(result.updatedAt);
  });
});
import { Types } from 'mongoose';
import { setUpInMemDB } from 'framework/tests';
import { wait, expectString, expectDate, mockReq, genTestEmail, TEST_PW,
  invaid_strs, invalid_emails, invalid_pws, testInvalidInputs, malformToken, registerAndLogin
 } from 'framework/tests';
import { verifyAccessToken } from 'framework/middleware';
import { InputError, AuthError, ConflictError } from 'framework/error';
import { con_auth_register, con_auth_login } from 'framework/controller';
import { con_entry_create, con_entry_get, con_entry_update, con_entry_delete } from './EntryController';

setUpInMemDB();

/******************************************************************************************************************
 * setup
 ******************************************************************************************************************/
const sameEmail = genTestEmail();
let userId = new Types.ObjectId;

beforeEach(async () => {
  userId = await registerAndLogin(sameEmail, TEST_PW);
});

/******************************************************************************************************************
 * con_entry_create
 ******************************************************************************************************************/
describe('con_entry_create', () => {
  
  test('InputError: invalid types', async () => {
    await testInvalidInputs(
      (title) => con_entry_create(mockReq({ title, content: 'valid' }, userId)),
      InputError, invaid_strs);
    await testInvalidInputs(
      (content) => con_entry_create(mockReq({ title: 'valid', content }, userId)),
      InputError, invaid_strs);
  });
});

/******************************************************************************************************************
 * con_entry_get
 ******************************************************************************************************************/
describe('con_entry_get', () => {
});

/******************************************************************************************************************
 * con_entry_update
 ******************************************************************************************************************/
describe('con_entry_update', () => {
});

/******************************************************************************************************************
 * con_entry_delete
 ******************************************************************************************************************/
describe('con_entry_delete', () => {
});

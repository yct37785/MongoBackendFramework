import { setUpInMemDB } from 'framework/tests';
import { wait, expectString, expectDate, mockReq, genTestEmail, TEST_PW,
  invaid_strs, invalid_emails, invalid_pws, testInvalidInputs, malformToken
 } from 'framework/tests';
import { InputError, AuthError, ConflictError } from 'framework/error';
import { con_auth_register, con_auth_login } from 'framework/controller';
import { con_entry_create, con_entry_get, con_entry_update, con_entry_delete } from './EntryController';

setUpInMemDB();

/******************************************************************************************************************
 * setup
 ******************************************************************************************************************/
const sameEmail = genTestEmail();
let loginData: any;

beforeEach(async () => {
  await con_auth_register(mockReq({ email: sameEmail, password: TEST_PW }));
  loginData = await con_auth_login(mockReq({ email: sameEmail, password: TEST_PW }));
});

/******************************************************************************************************************
 * con_entry_create
 ******************************************************************************************************************/
describe('con_entry_create', () => {
  test('InputError: invalid types', async () => {
    await testInvalidInputs(
      (email) => con_entry_create(mockReq({ email, password: TEST_PW })),
      InputError, invaid_strs);
    await testInvalidInputs(
      (password) => con_entry_create(mockReq({ email: sameEmail, password })),
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

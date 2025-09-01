import { Types } from 'mongoose';
import { EntryModel } from '../Models/EntryModel';
import { setUpInMemDB } from 'framework/tests';
import { mockReq, genTestEmail, TEST_PW,
  invaid_strs, invaid_strs_optional, invalid_objIds, testInvalidInputs, setupTestUserCon
 } from 'framework/tests';
import { InputError, NotFoundError } from 'framework/error';
import { con_entry_create, con_entry_get, con_entry_update, con_entry_delete } from './EntryController';

setUpInMemDB();

/******************************************************************************************************************
 * setup
 ******************************************************************************************************************/
const sameEmail = genTestEmail();
let userId = new Types.ObjectId;

beforeEach(async () => {
  userId = await setupTestUserCon(sameEmail, TEST_PW);
});

/******************************************************************************************************************
 * con_entry_create
 ******************************************************************************************************************/
describe('con_entry_create', () => {
  
  test('InputError: invalid types', async () => {
    // test body.title
    await testInvalidInputs(
      (title) => con_entry_create(mockReq({ title, content: 'valid' }, userId)),
      InputError, invaid_strs);
    // test body.content
    await testInvalidInputs(
      (content) => con_entry_create(mockReq({ title: 'valid', content }, userId)),
      InputError, invaid_strs);
  });

  test('created successfully', async () => {
    const result = await con_entry_create(mockReq({ title: 'new title', content: 'new content' }, userId));
    expect(result.msg).toBe('Entry created successfully');
    // entry exists in DB
    const retrieved = await EntryModel.findOne({ _id: result.entryId }).exec();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toEqual('new title');
    expect(retrieved?.content).toEqual('new content');
  });
});

/******************************************************************************************************************
 * con_entry_get
 ******************************************************************************************************************/
describe('con_entry_get', () => {

  test('InputError: invalid types', async () => {
    // test param.id
    await testInvalidInputs(
      (id) => con_entry_get(mockReq({}, userId, { id })),
      InputError, invaid_strs, invalid_objIds);
  });

  test('NotFoundError: non-existent id', async () => {
    await testInvalidInputs(
      (id) => con_entry_get(mockReq({}, userId, { id })),
      NotFoundError, [new Types.ObjectId]);
  });

  test('fetched successfully', async () => {
    const result = await con_entry_create(mockReq({ title: 'valid123', content: '4352353252345' }, userId));
    const id = result.entryId;
    const fetched = await con_entry_get(mockReq({}, userId, { id }));
    expect(fetched).not.toBeNull();
    expect(fetched.title).toEqual('valid123');
    expect(fetched.content).toEqual('4352353252345');
  });
});

/******************************************************************************************************************
 * con_entry_update
 ******************************************************************************************************************/
describe('con_entry_update', () => {
  let entryId = '';

  beforeEach(async () => {
    const result = await con_entry_create(mockReq({ title: 'new title', content: 'new content' }, userId));
    entryId = result.entryId;
  });

  test('InputError: invalid types', async () => {
    // test param.id
    await testInvalidInputs(
      (id) => con_entry_update(mockReq({ title: 'valid', content: 'valid' }, userId, { id })),
      InputError, invaid_strs, invalid_objIds);
    // test body.title
    await testInvalidInputs(
      (title) => con_entry_update(mockReq({ title, content: 'valid' }, userId, { id: entryId })),
      InputError, invaid_strs_optional);
    // test body.content
    await testInvalidInputs(
      (content) => con_entry_update(mockReq({ title: 'valid', content }, userId, { id: entryId })),
      InputError, invaid_strs_optional);
  });

  test('NotFoundError: non-existent id', async () => {
    await testInvalidInputs(
      (id) => con_entry_update(mockReq({ title: 'valid', content: 'valid' }, userId, { id })),
      NotFoundError, [new Types.ObjectId]);
  });

  test('updated successfully', async () => {
    const result = await con_entry_update(mockReq({ title: 'updated title', content: 'updated content' }, userId, { id: entryId }));
    expect(result.msg).toEqual('Entry updated successfully');
    // check values in DB
    const retrieved = await EntryModel.findOne({ _id: entryId }).exec();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toEqual('updated title');
    expect(retrieved?.content).toEqual('updated content');
  });
});

/******************************************************************************************************************
 * con_entry_delete
 ******************************************************************************************************************/
describe('con_entry_delete', () => {

  test('InputError: invalid types', async () => {
    // test param.id
    await testInvalidInputs(
      (id) => con_entry_delete(mockReq({}, userId, { id })),
      InputError, invaid_strs, invalid_objIds);
  });

  test('NotFoundError: non-existent id', async () => {
    await testInvalidInputs(
      (id) => con_entry_delete(mockReq({}, userId, { id })),
      NotFoundError, [new Types.ObjectId]);
  });

  test('deleted successfully', async () => {
    const result = await con_entry_create(mockReq({ title: 'new title', content: 'new content' }, userId));
    const id = result.entryId;

    const deleted = await con_entry_delete(mockReq({}, userId, { id }));
    expect(deleted.msg).toEqual('Entry deleted successfully');
    // entry does not exist in DB
    const retrieved = await EntryModel.findOne({ _id: id }).exec();
    expect(retrieved).toBeNull();
  });
});

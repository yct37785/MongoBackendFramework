import express from 'express';
const supRequest = require('supertest');
import { setUpInMemDB, genTestEmail, doPost, setupTestUsersSup } from 'framework/tests';
import { createApp } from 'framework/core';
import entryRoutes from '../src/Routes/EntryRoutes';

setUpInMemDB();

let server: ReturnType<typeof supRequest>;
// users
const users = [
  { email: genTestEmail(), password: 'sjnfmSDSF@d374' },
  { email: genTestEmail(), password: 'SFDasfdl#$1245' }
];
let accesses: string[] = [];

/******************************************************************************************************************
 * Setup.
 ******************************************************************************************************************/
beforeAll(async () => {
  const app = createApp(
    express.Router(),
    express
      .Router()
      .use('/entry', entryRoutes)
  );
  server = supRequest(app);
});

beforeEach(async () => {
  const { accessTokens } = await setupTestUsersSup(server, users);
  accesses = accessTokens;
});

/****************************************************************************************************************
 * users cannot access each other's entries
 ****************************************************************************************************************/
test('no cross-account entry access', async () => {
  const entryIds = ['', ''];
  // create entries
  let res = await doPost(server, '/entry/create', accesses[0], { title: 'entry A', content: 'entry A content' });
  expect(res.status).toBe(201);
  entryIds[0] = res.body.entryId;
  res = await doPost(server, '/entry/create', accesses[1], { title: 'entry B', content: 'entry B content' });
  expect(res.status).toBe(201);
  entryIds[1] = res.body.entryId;

  // cannot fetch other's entry
  res = await doPost(server, '/entry/get/:id', accesses[0], {}, { id: entryIds[1] });
  expect(res.status).toBe(404);
  res = await doPost(server, '/entry/get/:id', accesses[1], {}, { id: entryIds[0] });
  expect(res.status).toBe(404);

  // cannot update other's entry
  res = await doPost(server, '/entry/update/:id', accesses[0], { title: 'asdasd', content: 'asdasdsad' }, { id: entryIds[1] });
  expect(res.status).toBe(404);
  res = await doPost(server, '/entry/update/:id', accesses[1], { title: 'asdasd', content: 'asdasdsad' }, { id: entryIds[0] });
  expect(res.status).toBe(404);

  // cannot delete other's entry
  res = await doPost(server, '/entry/delete/:id', accesses[0], {}, { id: entryIds[1] });
  expect(res.status).toBe(404);
  res = await doPost(server, '/entry/delete/:id', accesses[1], {}, { id: entryIds[0] });
  expect(res.status).toBe(404);
});
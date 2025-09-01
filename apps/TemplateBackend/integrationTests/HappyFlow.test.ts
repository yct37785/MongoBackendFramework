import express from 'express';
const supRequest = require('supertest');
import { setUpInMemDB, genTestEmail, doPost, setupTestUsersSup, genRandomString } from 'framework/tests';
import { createApp } from 'framework/core';
import entryRoutes from '../src/Routes/EntryRoutes';

const TOTAL_ENTRIES = 3;

setUpInMemDB();

let server: ReturnType<typeof supRequest>;
// users
const users = [
  { email: genTestEmail(), password: 'sjnfmSDSF@d374' },
  { email: genTestEmail(), password: 'SFDasfdl#$1245' },
  { email: genTestEmail(), password: 'SFGasfdl#$1245' }
];
const entries: string[][] = [];
const entryValues: Record<string, string>[][] = [];
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
 * Happy flow script:
 * - register and login users
 * - create entries for users
 * - loop several times:
 *  + update entries
 *  + fetch entries and ensure values are updated ones
 * - delete entries for users
 ****************************************************************************************************************/
test('happy flow script', async () => {
  // create several entries per user
  for (let i = 0; i < users.length; ++i) {
    entries.push([]);
    entryValues.push([]);
    for (let j = 0; j < TOTAL_ENTRIES; ++j) {
      entryValues[i].push({
        title: genRandomString(),
        content: genRandomString()
      });
      let res = await doPost(server, '/entry/create', accesses[i], { title: entryValues[i][j].title, content: entryValues[i][j].content });
      expect(res.status).toBe(201);
      entries[i].push(res.body.entryId);
    }
  };

  // update and fetch entries (4 times)
  for (let k = 0; k < 4; ++k) {
    for (let i = 0; i < users.length; ++i) {
      for (let j = 0; j < TOTAL_ENTRIES; ++j) {
        // fetch entry and see if value matches
        let res = await doPost(server, '/entry/get/:id', accesses[i], {}, { id: entries[i][j] });
        expect(res.status).toBe(200);
        expect(res.body.title).toEqual(entryValues[i][j].title);
        expect(res.body.content).toEqual(entryValues[i][j].content);
        // update entry values
        entryValues[i][j] = {
          title: genRandomString(),
          content: genRandomString()
        };
        res = await doPost(server, '/entry/update/:id', accesses[i],
          { title: entryValues[i][j].title, content: entryValues[i][j].content }, { id: entries[i][j] });
        expect(res.status).toBe(200);
      }
    }
  }

  // delete entries
  for (let i = 0; i < users.length; ++i) {
    for (let j = 0; j < TOTAL_ENTRIES; ++j) {
      // delete entry
      let res = await doPost(server, '/entry/delete/:id', accesses[i], {}, { id: entries[i][j] });
      expect(res.status).toBe(200);
      // fetch entry to fail
      res = await doPost(server, '/entry/get/:id', accesses[i], {}, { id: entries[i][j] });
      expect(res.status).toBe(404);
    }
  }
});

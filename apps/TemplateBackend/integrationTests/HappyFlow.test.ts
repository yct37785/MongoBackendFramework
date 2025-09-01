import express from 'express';
const request = require('supertest');
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { setUpInMemDB } from 'framework/tests';
import { createApp } from 'framework/core';
import { mockReq, genTestEmail, TEST_PW,
  invaid_strs, invaid_strs_optional, invalid_objIds, testInvalidInputs, setupTestUserCon
 } from 'framework/tests';
import entryRoutes from '../src/Routes/EntryRoutes';

setUpInMemDB();

let server: ReturnType<typeof request>;
const email = genTestEmail();

/******************************************************************************************************************
 * Setup.
 ******************************************************************************************************************/
beforeAll(async () => {
  // setup routes
  const app = createApp(
    express.Router(),
    express
      .Router()
      .use('/entry', entryRoutes)
  );
  server = request(app);
});

/******************************************************************************************************************
 * Happy flow:
 * - create user 1 and 2
 * - login user 1 and 2
 * - user 1 create entry
 * - user 2 create entry
 * - user 1 unable to update user 2's entry
 * - user 2 unable to update user 1's entry
 * - user 1 update 
 ******************************************************************************************************************/
describe('int: happy flow', () => {
  
});
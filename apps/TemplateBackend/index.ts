/**************************************************************************************************
 * Launch file for Client Application using MongoBackendFramework
 **************************************************************************************************/
import {} from 'framework/types'; // type argumentation
import express from 'express';
import { loadEnv } from 'framework/utils';
import { createApp } from 'framework/core';
import entryRoutes from './src/Routes/EntryRoutes';

loadEnv();

// test rexport express works on client
const unprotectedRouter: express.Router = express.Router();
unprotectedRouter.get('/test-unprotected', async (req, res) => {
  return res.status(200).json('hello from TemplateBackend');
});

// initialize app with optional unprotected/protected routes
const app = createApp(
  unprotectedRouter, // optional unprotected routes (if any)
  express
    .Router()
    .use('/entry', entryRoutes)
);

// start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Client App running on port ${PORT}`);
});

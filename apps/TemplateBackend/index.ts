/**************************************************************************************************
 * Launch file for Client Application using MongoBackendFramework
 **************************************************************************************************/
import {} from 'framework/types'; // type argumentation
import express from 'express';
import { loadEnv } from 'f';
import { createApp } from '@yourname/mongo-backend-framework/createApp';
import workspaceRoutes from './src/routes/workspaceRoutes';
import projectRoutes from './src/routes/projectRoutes';

loadEnv();

// test rexport express works on client
const unprotectedRouter: express.Router = express.Router();
unprotectedRouter.get('/test-unprotected', async (req, res) => {
  return res.status(200).json('yes works');
});

// initialize app with optional unprotected/protected routes
const app = createApp(
  unprotectedRouter, // optional unprotected routes (if any)
  express
    .Router()
    .use('/workspace', workspaceRoutes)
    .use('/project', projectRoutes)
);

// start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Client App running on port ${PORT}`);
});

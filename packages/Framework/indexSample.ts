/**
 * Template launcher for the Mongo backend framework.
 * 
 * Demonstrates usage of `createApp()` by providing:
 * - A sample protected route (requires valid JWT)
 * - A sample unprotected route (public)
 * 
 * Notes:
 * - Configure dotenv here, ensure .env is populated with the required vars (see sample .env)
 * - This is useful for framework development, testing middleware, and verifying integration.
 */
import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createApp } from './src/app';

// define unprotected routes (no Authorization header required)
const unprotectedRoutes = express.Router();
unprotectedRoutes.get('/dev/public', (_req: Request, res: Response) => {
  res.json({ message: 'Hello from a public route!' });
});

// define protected routes (requires JWT auth via the Authorization header)
const protectedRoutes = express.Router();
protectedRoutes.get('/dev/protected', (req: Request, res: Response) => {
  res.json({ message: 'You hit a protected route!', user: req.user });
});

// create the app with both route sets
const app = createApp(unprotectedRoutes, protectedRoutes);

// start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🧪 Framework running in standalone mode on port ${PORT}`);
});

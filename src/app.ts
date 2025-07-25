import express, { Router } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import { verifyAccessTokenMiddleware } from './middleware/authMiddleware';
import { globalErrorHandler } from './error/globalErrorHandler';
import { validateEnv } from './utils/misc';

/**
 * Initializes and returns an Express app instance with core middleware,
 * MongoDB connection, and optional routes provided by applications using the framework.
 *
 * Framework includes:
 * - Environment validation
 * - Express body parser and CORS
 * - MongoDB connection
 * - `/ping` health check route
 * - `/auth` public auth routes
 * - Application-provided routes
 * - Global error handler
 *
 * @param unprotectedRoutes - Express Router containing public routes (no auth required)
 * @param protectedRoutes - Express Router containing protected routes (requires valid access token)
 * @returns Configured Express app instance
 */
export function createApp(unprotectedRoutes: Router, protectedRoutes: Router) {
  // ensure all required env vars are provided
  validateEnv();

  const app = express();
  app.use(express.json());

  // allow CORS from frontend origin
  app.use(cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
  }));

  // MongoDB Connection
  mongoose.connect(process.env.MONGO_URI!, { dbName: process.env.MONGO_DB_NAME });
  mongoose.connection.on('connected', () => {
    console.log('✅ Connected to MongoDB via Mongoose\n');
  });

  // health check
  app.get('/ping', async (_, res) => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      res.json({ message: 'Server is up.', ip: data.ip });
    } catch {
      res.status(500).json({ error: 'Failed to fetch IP' });
    }
  });

  // public routes
  app.use('/auth', authRoutes);

  // application-provided unprotected routes
  app.use(unprotectedRoutes);

  // protected routes
  app.use(verifyAccessTokenMiddleware);

  // application-provided protected routes
  app.use(protectedRoutes);

  // global error handler (must come after all routes)
  app.use(globalErrorHandler);

  return app;
}

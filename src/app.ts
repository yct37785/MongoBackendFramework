import 'dotenv/config';
import express, { Router } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import { verifyAccessTokenMiddleware } from './middleware/authMiddleware';
import { globalErrorHandler } from './error/globalErrorHandler';

export function createApp(applicationRoutes: Router) {
  const app = express();
  app.use(express.json());

  // allow CORS from frontend origin
  app.use(cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
  }));

  // MongoDB Connection
  mongoose.connect(process.env.MONGO_URI!, { dbName: process.env.DB_NAME || 'appDB' });
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

  // protected routes
  app.use(verifyAccessTokenMiddleware);

  // mount application-provided protected routes here
  app.use(applicationRoutes);

  // global error handler (must come after all routes)
  app.use(globalErrorHandler);

  return app;
}

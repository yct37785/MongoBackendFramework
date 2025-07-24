import 'dotenv/config';
import express from 'express';
import { createApp } from './index';
import { Request, Response } from 'express';

const appRouter = express.Router();

// example protected route under `/dev`
appRouter.get('/dev/test', (req: Request, res: Response) => {
  // req.user should be set by verifyAccessTokenMiddleware
  res.json({ message: 'Protected test route hit!', user: req.user });
});

const app = createApp(appRouter);

app.listen(process.env.PORT, () => {
  console.log(`🧪 Framework running in standalone mode on port ${process.env.PORT}`);
});

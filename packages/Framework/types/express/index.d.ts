import 'express';
import { Types } from 'mongoose';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: Types.ObjectId;
      email: string;
    };
  }
}
/**************************************************************************************************
 * Entry point for MongoBackendFramework
 * Exports app modules and dependencies
 **************************************************************************************************/

// core framework exports
export * from './src/controller/authController';
export * from './src/error/AppError';
export * from './src/error/globalErrorHandler';
export * from './src/middleware/asyncHandler';
export * from './src/middleware/authMiddleware';
export * from './src/models/userModel';
export * from './src/services/authServices';
export * from './src/utils/inputSanitizer';
export * from './src/utils/misc';
export * from './src/utils/testUtils';
export * from './src/utils/setupTestDB';
export { createApp } from './src/app';
export * from './src/consts';

// common modules re-exported for client usage
export { default as express } from 'express';
export { default as mongoose } from 'mongoose';
export { default as axios } from 'axios';
export * as uuid from 'uuid';

// express type re-exports
export type { Request, Response, NextFunction, Router } from 'express';
export type { ObjectId } from 'mongoose';
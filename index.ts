/**************************************************************************************************
 * Entry point for MongoBackendFramework
 * Exports app modules and dependencies
 **************************************************************************************************/

// core framework exports
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
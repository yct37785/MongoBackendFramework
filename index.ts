// common modules re-exported for client usage
export { default as express } from 'express';
export { default as mongoose } from 'mongoose';
export { default as axios } from 'axios';
export * as uuid from 'uuid';

// express type re-exports
export type { Request, Response, NextFunction, Router } from 'express';
export type { ObjectId } from 'mongoose';
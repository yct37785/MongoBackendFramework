import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import type { MongoServerError } from 'mongodb';
import type { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError } from './AppError';

/******************************************************************************************************************
 * globalErrorHandler - Express error-handling middleware
 * Centralized error handler for all errors thrown in the app. Handles:
 * - Custom AppErrors
 * - Mongoose validation and cast errors
 * - MongoDB duplicate key errors
 * - JWT-related errors
 * - Fallback 500 for unknown issues
 * 
 * @param err - error object thrown in the application
 * @param req - Express request object
 * @param res - Express response object
 * @param _next - Express next function (unused)
 * 
 * @returns obj - JSON response containing the error message
 ******************************************************************************************************************/
export const globalErrorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // custom AppError and subclasses
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ err: err.message });
  }
  console.log('❌ Unhandled error:', err);

  // Mongoose ValidationError
  if (isMongooseValidationError(err)) {
    return res.status(400).json({ err: 'Validation failed' });
  }

  // Mongoose CastError (e.g., invalid ObjectId)
  if (isMongooseCastError(err)) {
    return res.status(400).json({ err: 'Invalid resource ID' });
  }

  // MongoDB duplicate key error (e.g., unique email conflict)
  if (isMongoDuplicateKeyError(err)) {
    const duplicatedField = Object.keys(err.keyValue ?? {})[0] || 'Field';
    return res.status(409).json({ err: `${duplicatedField} is already in use` });
  }

  // JWT errors
  if (isJwtError(err)) {
    return res.status(401).json({ err: 'Invalid or expired token' });
  }

  // fallback
  return res.status(500).json({ err: 'Internal server error' });
};

/******************************************************************************************************************
 * Type guards for specific error types
 *
 * @param err - error object to check
 * 
 * @returns bool - true if the error is of specific type
 ******************************************************************************************************************/
function isMongooseValidationError(err: any): err is Error {
  return err?.name === 'ValidationError';
}

function isMongooseCastError(err: any): err is Error {
  return err?.name === 'CastError';
}

function isMongoDuplicateKeyError(err: any): err is MongoServerError {
  return err?.code === 11000 && !!err.keyValue;
}

function isJwtError(err: any): err is JsonWebTokenError | TokenExpiredError {
  return err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError';
}

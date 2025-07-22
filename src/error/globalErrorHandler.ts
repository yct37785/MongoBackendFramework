import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

/******************************************************************************************************************
 * globalErrorHandler - Express error-handling middleware
 *
 * Centralizes error processing for the app. Detects custom AppErrors, MongoDB errors, validation issues,
 * and defaults to a 500 fallback.
 ******************************************************************************************************************/
export const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // AppError (explicitly thrown from code)
  if (err.name === 'CustomAppError') {
    res.status(err.statusCode).json({ err: err.message });
  }

  console.log('❌ Unhandled error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({ err: 'Validation failed' });
  }

  // Mongoose bad ObjectId (e.g., malformed _id)
  if (err.name === 'CastError') {
    res.status(400).json({ err: 'Invalid resource ID' });
  }

  // duplicate key (e.g., unique email conflict)
  if (err.code === 11000) {
    const duplicatedField = Object.keys(err.keyValue)[0];
    res.status(409).json({ err: `${duplicatedField} is already in use` });
  }

  // token-related error (optional if using JWT)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({ err: 'Invalid or expired token' });
  }

  // default fallback
  res.status(500).json({ err: 'Internal server error' });
}

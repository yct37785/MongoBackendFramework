import { Request, Response, NextFunction } from 'express';

/******************************************************************************************************************
 * Wraps an async Express route handler to automatically catch and forward errors.
 *
 * Automatically catches errors thrown inside async functions and passes them to the Express error handler,
 * eliminating repetitive try/catch blocks in each route.
 *
 * @param fn - async route handler function to wrap
 * 
 * @returns func - wrapped function that calls next() with any thrown error
 ******************************************************************************************************************/
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
}

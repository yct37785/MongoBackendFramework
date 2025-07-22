import { Request, Response, NextFunction } from 'express';

/******************************************************************************************************************
 * asyncHandler - Utility wrapper for async route handlers.
 *
 * Automatically catches errors thrown inside async functions and passes them to the Express error handler,
 * eliminating repetitive try/catch blocks in each route.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => {
 *     const data = await someAsyncOp();
 *     res.json(data);
 *   }));
 *
 * @param fn - The async function to wrap (standard Express handler signature)
 * @returns A new function that handles errors using next()
 ******************************************************************************************************************/
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
}

import { Request, Response, NextFunction } from 'express';

/******************************************************************************************************************
 * Wraps an async route/controller function and forwards any rejection to the next error handler.
 *
 * @param fn - async handler to wrap
 *
 * @return - wrapped handler that auto-catches async errors
 *
 * @usage
 * ```ts
 * app.get("/profile",
 *   asyncHandler(async (req, res) => {
 *     const user = await fetchUser(req);
 *     res.json(user);
 *   })
 * );
 * ```
 ******************************************************************************************************************/
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
}

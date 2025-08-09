/******************************************************************************************************************
 * Base application error class.
 *
 * @param message - error message to display
 * @param statusCode - HTTP status code (default 500)
 * 
 * @returns obj - custom error instance with message and status code
 ******************************************************************************************************************/
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'CustomAppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/******************************************************************************************************************
 * InputError (400 Bad Request)
 * Use when the client sends invalid input (e.g., bad types, lengths, or format).
 * Triggered typically by sanitizers, validators, or schema mismatches.
 * 
 * @param message - description of the invalid input
 * 
 * @returns obj - error instance
 ******************************************************************************************************************/
export class InputError extends AppError {
  constructor(message: string) {
    super(`Invalid input: ${message}`, 400);
  }
}

/******************************************************************************************************************
 * AuthError (401 Unauthorized)
 * Use when authentication fails — e.g., bad credentials, invalid tokens, or missing login.
 * Does NOT imply permission issues (that’s ForbiddenError).
 *
 * @param message - reason for authentication failure
 * 
 * @returns obj - error instance
 ******************************************************************************************************************/
export class AuthError extends AppError {
  constructor(message: string) {
    super(`Unauthorized: ${message}`, 401);
  }
}

/******************************************************************************************************************
 * PermissionError (403 Forbidden)
 * Use when the user is authenticated but lacks permission to access the resource.
 * Example: trying to delete another user’s data.
 * 
 * @param message - reason for permission denial
 * 
 * @returns obj - error instance
 ******************************************************************************************************************/
export class PermissionError extends AppError {
  constructor(message: string) {
    super(`Forbidden: ${message}`, 403);
  }
}

/******************************************************************************************************************
 * NotFoundError (404 Not Found)
 * Use when a resource is not found or no longer exists.
 * Example: accessing a deleted project or invalid ObjectId that passes validation.
 * 
 * @param message - description of the missing resource
 * 
 * @returns obj - error instance
 ******************************************************************************************************************/
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(`Not found: ${message}`, 404);
  }
}

/******************************************************************************************************************
 * ConflictError (409 Conflict)
 * Use when a request would result in a duplicate or conflicting resource.
 * Example: trying to register an email that already exists, or a unique constraint violation.
 * 
 * @param message - description of the conflict
 * 
 * @returns obj - error instance
 ******************************************************************************************************************/
export class ConflictError extends AppError {
  constructor(message: string) {
    super(`Conflict: ${message}`, 409);
  }
}

/******************************************************************************************************************
 * InternalError (500 Internal Server Error)
 * Catch-all for unexpected failures. Use sparingly in deeply nested or critical failures.
 * Ideally log these for later diagnosis.
 * 
 * @param message - description of the internal failure
 * 
 * @returns obj - error instance
 ******************************************************************************************************************/
export class InternalError extends AppError {
  constructor(message: string) {
    super(`Internal server error: ${message}`, 500);
  }
}

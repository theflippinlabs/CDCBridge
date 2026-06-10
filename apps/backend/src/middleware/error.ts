import type { NextFunction, Request, Response } from 'express';

/** Thrown by route handlers to return a specific status + message. */
export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Wrap async route handlers so rejected promises reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  // Surface Supabase/PostgREST errors with a 400 where possible.
  if (err && typeof err === 'object' && 'message' in err) {
    const message = String((err as { message: unknown }).message);
    res.status(400).json({ error: message });
    return;
  }
  res.status(500).json({ error: 'Internal server error.' });
}

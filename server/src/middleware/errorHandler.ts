import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  if (err instanceof Error) {
    const clientErrors = [
      'Invalid email or password',
      'Invalid verification code',
      'Current password is incorrect',
      'Account temporarily locked',
    ];
    const status = clientErrors.some((m) => err.message.includes(m) || err.message === m)
      ? 400
      : err.message.includes('not found')
        ? 404
        : err.message.includes('permissions') || err.message.includes('authorized')
          ? 403
          : 500;

    if (status === 500) {
      console.error(err);
    }

    res.status(status).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
}

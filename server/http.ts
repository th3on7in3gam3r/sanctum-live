import type { Response } from 'express';
import { SanctumError } from '../shared/errors.ts';

export function sendError(res: Response, error: unknown): void {
  if (error instanceof SanctumError) {
    res.status(error.status).json({
      error: error.code,
      message: error.message,
      details: error.details ?? null,
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error';
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message,
    details: null,
  });
}

import type { Request, Response } from 'express';
import { pingDatabase } from '../prisma.ts';
import { getLiveKitStatus } from '../env.ts';
import { sendError } from '../http.ts';

export async function healthHandler(_req: Request, res: Response): Promise<void> {
  try {
    const database = await pingDatabase();
    const livekit = getLiveKitStatus();
    res.json({
      ok: true,
      database,
      livekit,
      realtimeEngine: livekit === 'configured' ? 'configured' : 'not_configured',
    });
  } catch (error) {
    sendError(res, error);
  }
}

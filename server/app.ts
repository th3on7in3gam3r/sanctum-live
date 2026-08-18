import { existsSync } from 'node:fs';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { healthHandler } from './routes/health.ts';
import { createPrayerRoomHandler } from './routes/prayerRooms.ts';
import {
  createPrayerSessionHandler,
  endPrayerSessionHandler,
  grantSpeakerHandler,
  inviteSpeakerHandler,
  joinSessionHandler,
  raiseHandHandler,
  removeParticipantHandler,
  revokeSpeakerHandler,
  startPrayerSessionHandler,
  transferSpeakerHandler,
} from './routes/sessions.ts';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', healthHandler);
  app.post('/api/prayer-rooms', createPrayerRoomHandler);
  app.post('/api/prayer-sessions', createPrayerSessionHandler);
  app.post('/api/prayer-sessions/:id/start', startPrayerSessionHandler);
  app.post('/api/prayer-sessions/:id/end', endPrayerSessionHandler);
  app.post('/api/sessions/:id/join', joinSessionHandler);
  app.post('/api/sessions/:id/raise-hand', raiseHandHandler);
  app.post('/api/sessions/:id/speaker/invite', inviteSpeakerHandler);
  app.post('/api/sessions/:id/speaker/grant', grantSpeakerHandler);
  app.post('/api/sessions/:id/speaker/revoke', revokeSpeakerHandler);
  app.post('/api/sessions/:id/speaker/transfer', transferSpeakerHandler);
  app.post('/api/sessions/:id/participants/:participantId/remove', removeParticipantHandler);

  const here = path.dirname(fileURLToPath(import.meta.url));
  const distDir = existsSync(path.join(here, 'index.html'))
    ? here
    : path.resolve(here, '../dist');
  if (existsSync(path.join(distDir, 'index.html'))) {
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  return app;
}

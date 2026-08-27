/// <reference types="@clerk/express/env" />
import { existsSync } from 'node:fs';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { healthHandler } from './routes/health.ts';
import { createPrayerRoomHandler, deletePrayerRoomHandler, listPrayerRoomsHandler, updatePrayerRoomHandler } from './routes/prayerRooms.ts';
import {
  acceptSpeakerHandler,
  createPrayerSessionHandler,
  declineSpeakerHandler,
  dismissHandHandler,
  endPrayerSessionHandler,
  getAltarBySlugHandler,
  listLiveAltarsHandler,
  getSessionSnapshotHandler,
  grantSpeakerHandler,
  inviteSpeakerHandler,
  joinSessionHandler,
  leaveSessionHandler,
  lowerHandHandler,
  muteParticipantHandler,
  unmuteParticipantHandler,
  openPrayerSessionHandler,
  postChatHandler,
  raiseHandHandler,
  removeParticipantHandler,
  setCongregationMuteHandler,
  startPttHandler,
  endPttHandler,
  startPrivatePrayerHandler,
  endPrivatePrayerHandler,
  revokeSpeakerHandler,
  startPrayerSessionHandler,
  transferSpeakerHandler,
} from './routes/sessions.ts';
import { clerkMiddleware } from '@clerk/express';
import { isClerkConfigured } from './env.ts';
import { meHandler } from './routes/me.ts';
import { createSpaceHandler, deleteCurrentSpaceHandler, updateCurrentSpaceHandler } from './routes/spaces.ts';
import { inviteTeamMemberHandler, listTeamHandler, removeTeamMemberHandler } from './routes/team.ts';
import { livekitWebhookHandler } from './routes/webhooks.ts';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.post(
    '/api/livekit/webhooks',
    express.raw({ type: '*/*', limit: '1mb' }),
    livekitWebhookHandler
  );

  app.use(express.json({ limit: '1mb' }));
  if (isClerkConfigured()) {
    app.use(clerkMiddleware());
  }

  app.get('/api/health', healthHandler);
  app.get('/api/me', meHandler);
  app.post('/api/spaces', createSpaceHandler);
  app.patch('/api/spaces/current', updateCurrentSpaceHandler);
  app.delete('/api/spaces/current', deleteCurrentSpaceHandler);
  app.get('/api/team', listTeamHandler);
  app.post('/api/team/invite', inviteTeamMemberHandler);
  app.delete('/api/team/:userId', removeTeamMemberHandler);
  app.get('/api/prayer-rooms', listPrayerRoomsHandler);
  app.post('/api/prayer-rooms', createPrayerRoomHandler);
  app.patch('/api/prayer-rooms/:roomId', updatePrayerRoomHandler);
  app.delete('/api/prayer-rooms/:roomId', deletePrayerRoomHandler);
  app.get('/api/altar/live', listLiveAltarsHandler);
  app.get('/api/altar/:slug', getAltarBySlugHandler);
  app.post('/api/prayer-sessions', createPrayerSessionHandler);
  app.post('/api/prayer-sessions/:id/open', openPrayerSessionHandler);
  app.post('/api/prayer-rooms/:roomId/open-session', (req, res, next) => {
    req.body = { ...(req.body || {}), prayerRoomId: req.params.roomId };
    void openPrayerSessionHandler(req, res).catch(next);
  });
  app.post('/api/prayer-sessions/:id/start', startPrayerSessionHandler);
  app.post('/api/prayer-sessions/:id/end', endPrayerSessionHandler);
  app.get('/api/sessions/:id', getSessionSnapshotHandler);
  app.post('/api/sessions/:id/join', joinSessionHandler);
  app.post('/api/sessions/:id/leave', leaveSessionHandler);
  app.post('/api/sessions/:id/raise-hand', raiseHandHandler);
  app.post('/api/sessions/:id/lower-hand', lowerHandHandler);
  app.post('/api/sessions/:id/hands/:handId/dismiss', dismissHandHandler);
  app.post('/api/sessions/:id/speaker/invite', inviteSpeakerHandler);
  app.post('/api/sessions/:id/speaker/accept', acceptSpeakerHandler);
  app.post('/api/sessions/:id/speaker/decline', declineSpeakerHandler);
  app.post('/api/sessions/:id/speaker/grant', grantSpeakerHandler);
  app.post('/api/sessions/:id/speaker/revoke', revokeSpeakerHandler);
  app.post('/api/sessions/:id/speaker/transfer', transferSpeakerHandler);
  app.post('/api/sessions/:id/participants/:participantId/mute', muteParticipantHandler);
  app.post('/api/sessions/:id/participants/:participantId/unmute', unmuteParticipantHandler);
  app.post('/api/sessions/:id/participants/:participantId/remove', removeParticipantHandler);
  app.post('/api/sessions/:id/chat', postChatHandler);
  app.post('/api/sessions/:id/congregation-mute', setCongregationMuteHandler);
  app.post('/api/sessions/:id/ptt/start', startPttHandler);
  app.post('/api/sessions/:id/ptt/end', endPttHandler);
  app.post('/api/sessions/:id/private-prayer/start', startPrivatePrayerHandler);
  app.post('/api/sessions/:id/private-prayer/end', endPrivatePrayerHandler);

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

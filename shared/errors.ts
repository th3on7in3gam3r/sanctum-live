export type SanctumErrorCode =
  | 'UNAUTHORIZED'
  | 'ROOM_NOT_FOUND'
  | 'SESSION_NOT_FOUND'
  | 'INVALID_SESSION_TRANSITION'
  | 'REALTIME_UNAVAILABLE'
  | 'DATABASE_UNAVAILABLE'
  | 'SPEAKER_FLOOR_OCCUPIED'
  | 'PARTICIPANT_NOT_FOUND'
  | 'DUPLICATE_SLUG';

export class SanctumError extends Error {
  readonly code: SanctumErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: SanctumErrorCode, message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = 'SanctumError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const Unauthorized = (message = 'Not authorized for this action') =>
  new SanctumError('UNAUTHORIZED', message, 403);

export const RoomNotFound = (id?: string) =>
  new SanctumError('ROOM_NOT_FOUND', 'Prayer room not found', 404, id ? { id } : undefined);

export const SessionNotFound = (id?: string) =>
  new SanctumError('SESSION_NOT_FOUND', 'Prayer session not found', 404, id ? { id } : undefined);

export const InvalidSessionTransition = (from: string, to: string) =>
  new SanctumError(
    'INVALID_SESSION_TRANSITION',
    `Cannot transition prayer session from ${from} to ${to}`,
    409,
    { from, to }
  );

export const RealtimeUnavailable = (message = 'LiveKit connection unavailable in this environment.') =>
  new SanctumError('REALTIME_UNAVAILABLE', message, 503);

export const DatabaseUnavailable = (message = 'Database is not configured in this environment.') =>
  new SanctumError('DATABASE_UNAVAILABLE', message, 503);

export const SpeakerFloorOccupied = (currentSpeakerId?: string) =>
  new SanctumError(
    'SPEAKER_FLOOR_OCCUPIED',
    'Another participant currently holds the speaker floor.',
    409,
    currentSpeakerId ? { currentSpeakerId } : undefined
  );

export const ParticipantNotFound = (id?: string) =>
  new SanctumError('PARTICIPANT_NOT_FOUND', 'Session participant not found', 404, id ? { id } : undefined);

export const DuplicateSlug = (slug: string) =>
  new SanctumError(
    'DUPLICATE_SLUG',
    'This Permanent Altar Link is already in use.',
    409,
    { slug }
  );

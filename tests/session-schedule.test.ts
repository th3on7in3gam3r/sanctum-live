import { describe, expect, it } from 'vitest';
import { formatClockTime, getNextOccurrences, parseClockTime, zonedWallTime } from '../src/services/sessionScheduler.ts';
import type { PrayerRoom } from '../src/types';

const room = (overrides: Partial<PrayerRoom> = {}): PrayerRoom => ({
  id: 'room_1',
  organizationId: 'org_1',
  name: 'Hadassah Room',
  slug: 'hadassah-room',
  roomType: 'AUDIO_PRAYER',
  expectedAttendance: 100,
  speakerPermission: 'ADMIN_APPROVAL_REQUIRED',
  isRecurring: true,
  recurrenceRule: 'DAILY',
  scheduledStart: '06:30 PM',
  timezone: 'Africa/Kampala',
  recordingEnabled: false,
  status: 'SCHEDULED',
  permanentUrl: '/join/hadassah-room',
  createdAt: '2026-08-20T00:00:00.000Z',
  updatedAt: '2026-08-20T00:00:00.000Z',
  ...overrides,
});

describe('parseClockTime', () => {
  it('parses 12-hour times', () => {
    expect(parseClockTime('06:29 PM')).toEqual({ hours: 18, minutes: 29 });
    expect(parseClockTime('05:00 AM')).toEqual({ hours: 5, minutes: 0 });
  });
});

describe('getNextOccurrences', () => {
  it('keeps a start time that just passed within the grace window', () => {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const next = getNextOccurrences(
      room({
        timezone: tz,
        scheduledStart: formatClockTime(twoMinutesAgo.getHours(), twoMinutesAgo.getMinutes()),
      }),
      1
    )[0];
    expect(next).toBeDefined();
    expect(now.getTime() - next.getTime()).toBeGreaterThanOrEqual(0);
    expect(now.getTime() - next.getTime()).toBeLessThan(10 * 60 * 1000);
  });

  it('builds a Kampala wall clock instant', () => {
    const instant = zonedWallTime('Africa/Kampala', 2026, 8, 20, 18, 30);
    const hour = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Kampala',
        hour: 'numeric',
        hourCycle: 'h23',
      }).format(instant)
    );
    const minute = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Kampala',
        minute: '2-digit',
      }).format(instant)
    );
    expect(hour % 24).toBe(18);
    expect(minute).toBe(30);
  });
});

import { PrayerRoom, PrayerSession } from '../types';

/**
 * Calculates the next occurrences for a prayer room over the next 7 to 14 days.
 * Preserves the designated room timezone.
 */
export function getNextOccurrences(room: PrayerRoom, count: number = 7): Date[] {
  const occurrences: Date[] = [];
  const now = new Date();
  
  // Parse room's scheduledStart e.g. "05:00 AM", "12:00 PM", "22:00", "05:00"
  let targetHours = 5;
  let targetMinutes = 0;
  
  const timeStr = room.scheduledStart || '05:00 AM';
  const matchAmPm = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (matchAmPm) {
    let h = parseInt(matchAmPm[1], 10);
    const m = parseInt(matchAmPm[2], 10);
    const ampm = matchAmPm[3]?.toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    targetHours = h;
    targetMinutes = m;
  }

  // Day names helper
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const selectedDays = room.selectedDays || (room.recurrenceRule === 'DAILY' ? dayNames : ['Sunday']);

  let checkDate = new Date(now);
  // Search forward for next occurrences
  for (let i = 0; i < 30 && occurrences.length < count; i++) {
    const candidate = new Date(checkDate);
    candidate.setHours(targetHours, targetMinutes, 0, 0);

    const currentDayName = dayNames[candidate.getDay()];
    const isDayMatched = room.isRecurring
      ? room.recurrenceRule === 'DAILY' || selectedDays.includes(currentDayName)
      : i === 0;

    if (isDayMatched && candidate.getTime() > now.getTime()) {
      occurrences.push(candidate);
    }

    // Move to next day
    checkDate.setDate(checkDate.getDate() + 1);
  }

  return occurrences;
}

/**
 * Formats a scheduled date in relation to current time (e.g. "Today • 05:00 AM", "Tomorrow • 05:00 AM", "Friday • 10:00 PM")
 */
export function formatScheduledDisplay(scheduledDateOrTime: string | Date, timezone?: string): string {
  let targetDate: Date;
  if (typeof scheduledDateOrTime === 'string') {
    if (scheduledDateOrTime.includes('T') || scheduledDateOrTime.includes('-')) {
      targetDate = new Date(scheduledDateOrTime);
    } else {
      // Just a time string like "05:00 AM"
      return scheduledDateOrTime;
    }
  } else {
    targetDate = scheduledDateOrTime;
  }

  if (isNaN(targetDate.getTime())) {
    return String(scheduledDateOrTime);
  }

  const now = new Date();
  const isToday =
    targetDate.getDate() === now.getDate() &&
    targetDate.getMonth() === now.getMonth() &&
    targetDate.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    targetDate.getDate() === tomorrow.getDate() &&
    targetDate.getMonth() === tomorrow.getMonth() &&
    targetDate.getFullYear() === tomorrow.getFullYear();

  const timeFormatted = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone || undefined,
  }).format(targetDate);

  if (isToday) {
    return `Today • ${timeFormatted}`;
  }
  if (isTomorrow) {
    return `Tomorrow • ${timeFormatted}`;
  }

  const dayOfWeek = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: timezone || undefined,
  }).format(targetDate);

  const monthDay = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: timezone || undefined,
  }).format(targetDate);

  return `${dayOfWeek}, ${monthDay} • ${timeFormatted}`;
}

/**
 * Generates rolling scheduled sessions for rooms for the next 7 days if none exist.
 */
export function generateRollingSessions(rooms: PrayerRoom[], existingSessions: PrayerSession[]): PrayerSession[] {
  const newSessions: PrayerSession[] = [...existingSessions];

  rooms.forEach((room) => {
    // Check if room already has future scheduled sessions
    const hasScheduled = existingSessions.some(
      (s) => s.prayerRoomId === room.id && (s.status === 'SCHEDULED' || s.status === 'WAITING' || s.status === 'LIVE')
    );

    if (!hasScheduled) {
      const occurrences = getNextOccurrences(room, 3);
      occurrences.forEach((occ, idx) => {
        const id = `session_${room.slug}_${occ.getTime()}`;
        const alreadyExists = newSessions.some((s) => s.id === id);
        if (!alreadyExists) {
          newSessions.push({
            id,
            prayerRoomId: room.id,
            roomName: room.name,
            organizationName: 'Sanctum Sanctuary',
            status: idx === 0 && room.status === 'LIVE' ? 'LIVE' : 'SCHEDULED',
            scheduledStartTime: occ.toISOString(),
            durationSeconds: 0,
            totalUniqueParticipants: 0,
            peakConcurrentParticipants: 0,
            totalParticipants: 0,
            peakParticipants: 0,
            listenersWaitingCount: 0,
            createdAt: new Date().toISOString(),
          });
        }
      });
    }
  });

  return newSessions;
}

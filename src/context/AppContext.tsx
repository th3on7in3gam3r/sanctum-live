import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  PrayerRoom,
  PrayerSession,
  Participant,
  RaisedHand,
  PrayerRequest,
  DataSaverMode,
  Role,
  ToastItem,
  ToastType,
  ConfirmActionOptions,
} from '../types';
import {
  SEED_PRAYER_ROOMS,
  SEED_LIVE_SESSION,
  SEED_PARTICIPANTS,
  SEED_RAISED_HANDS,
  SEED_PRAYER_REQUESTS,
  SEED_HISTORY_SESSIONS,
} from '../data/seedData';
import { generateRollingSessions } from '../services/sessionScheduler';
import { AuditLogger } from '../services/auditLogger';
import { localPersistenceAdapter } from '../services/persistence/localPersistenceAdapter';
import { sessionApiAdapter } from '../services/domain/sessionApiAdapter';
import { sanctumApi } from '../services/api/sanctumApi';

export type Toast = ToastItem;

export interface AppContextType {
  prayerRooms: PrayerRoom[];
  prayerSessions: PrayerSession[];
  historySessions: PrayerSession[];
  liveSession: PrayerSession | null;
  participants: Participant[];
  raisedHands: RaisedHand[];
  prayerRequests: PrayerRequest[];
  dataSaverMode: DataSaverMode;
  isDarkMode: boolean;
  toasts: ToastItem[];
  confirmModalConfig: ConfirmActionOptions | null;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (dirty: boolean) => void;
  
  // Theme & Settings
  toggleDarkMode: () => void;
  setDataSaverMode: (mode: DataSaverMode) => void;
  addToast: (
    toastOrMessage: string | Omit<ToastItem, 'id'>,
    type?: ToastType,
    title?: string
  ) => void;
  removeToast: (id: string) => void;

  // Confirmation Modal
  confirmAction: (options: ConfirmActionOptions) => void;
  closeConfirmModal: () => void;

  // Prayer Room operations
  createPrayerRoom: (data: Omit<PrayerRoom, 'id' | 'createdAt' | 'updatedAt'>) => PrayerRoom;
  updatePrayerRoom: (id: string, updates: Partial<PrayerRoom>) => void;
  deletePrayerRoom: (id: string) => void;

  // Session Lifecycle Machine
  openSanctuary: (roomId: string) => void;
  startPrayerSession: (roomId: string) => void;
  endPrayerSession: (sessionIdOrAdminId?: string, adminId?: string) => Promise<void>;
  cancelPrayerSession: (sessionId: string) => void;
  startLiveSession: (roomId: string) => void;
  endLiveSession: (sessionIdOrAdminId?: string, adminId?: string) => Promise<void>;

  // Control room & Moderation operations
  inviteToPray: (participantId: string, adminId?: string) => Promise<void>;
  inviteSpeaker: (participantId: string, adminId?: string) => Promise<void>;
  dismissHand: (raisedHandId: string) => void;
  dismissRaisedHand: (raisedHandId: string) => void;
  muteSpeaker: (participantId: string, adminId?: string) => Promise<void>;
  muteParticipant: (participantId: string, adminId?: string) => Promise<void>;
  unmuteParticipant: (participantId: string) => Promise<void>;
  endSpeaker: (participantId: string, adminId?: string) => Promise<void>;
  removeParticipant: (participantId: string, adminId?: string) => Promise<void>;
  updateParticipantRole: (participantId: string, newRole: Role, adminId?: string) => Promise<void>;
  assignRole: (participantId: string, newRole: Role, adminId?: string) => Promise<void>;

  // Public / Attendee actions
  joinPrayerRoom: (roomSlug: string, name: string) => Promise<{ participantId: string; role: Role }>;
  raiseHandAttendee: (participantId: string, name: string) => Promise<void>;
  lowerHandAttendee: (participantId: string) => Promise<void>;
  sendReactionAttendee: (emoji: 'AMEN' | 'PRAISE_GOD') => void;
  submitPrayerRequest: (data: { request: string; isPrivate: boolean; participantName: string; roomName?: string }) => void;
  
  // Prayer Request management
  markPrayerRequestAnswered: (id: string, note?: string) => void;
  archivePrayerRequest: (id: string) => void;
  addPrayerRequestNote: (id: string, note: string) => void;
  addNoteToPrayerRequest: (id: string, note: string) => void;

  // Simulation helpers for testing
  simulateParticipantJoin: (name?: string) => void;
  simulateIncomingPrayerRequest: (customRequest?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /**
   * Enforces org-scoped Permanent Altar Link uniqueness in the prototype store.
   * Future database constraint (already in prisma/schema.prisma):
   *   @@unique([organizationId, slug])
   */
  const isSlugTaken = (
    rooms: PrayerRoom[],
    organizationId: string,
    slug: string,
    excludeRoomId?: string
  ) => {
    const normalized = slug.toLowerCase().trim();
    return rooms.some(
      (room) =>
        room.organizationId === organizationId &&
        room.id !== excludeRoomId &&
        (room.slug || '').toLowerCase().trim() === normalized
    );
  };

  const dedupePrayerRooms = (rooms: PrayerRoom[]): PrayerRoom[] => {
    const sorted = [...rooms].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const seen = new Map<string, PrayerRoom>();
    for (const room of sorted) {
      const key = `${room.organizationId}::${(room.slug || '').toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.set(key, room);
      }
    }
    return Array.from(seen.values());
  };

  const [prayerRooms, setPrayerRooms] = useState<PrayerRoom[]>(() => {
    const parsed = localPersistenceAdapter.loadRooms(SEED_PRAYER_ROOMS);
    return dedupePrayerRooms(parsed.length ? parsed : SEED_PRAYER_ROOMS);
  });

  const [historySessions, setHistorySessions] = useState<PrayerSession[]>(() => {
    return localPersistenceAdapter.loadHistory(SEED_HISTORY_SESSIONS);
  });

  const [liveSession, setLiveSession] = useState<PrayerSession | null>(SEED_LIVE_SESSION);
  const [participants, setParticipants] = useState<Participant[]>(SEED_PARTICIPANTS);
  const [raisedHands, setRaisedHands] = useState<RaisedHand[]>(SEED_RAISED_HANDS);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>(() => {
    return localPersistenceAdapter.loadRequests(SEED_PRAYER_REQUESTS);
  });

  // Rolling scheduled sessions
  const [scheduledSessions, setScheduledSessions] = useState<PrayerSession[]>(() => {
    return generateRollingSessions(prayerRooms, historySessions);
  });

  const [dataSaverMode, setDataSaverModeState] = useState<DataSaverMode>(() => {
    return (localPersistenceAdapter.loadDataSaver('AUTOMATIC') as DataSaverMode) || 'AUTOMATIC';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => localPersistenceAdapter.loadTheme());

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModalConfig, setConfirmModalConfig] = useState<ConfirmActionOptions | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Concurrency guard to prevent duplicate actions
  const isMutatingRef = useRef(false);

  // Prototype shell persistence adapter (not the production database).
  useEffect(() => {
    localPersistenceAdapter.saveRooms(prayerRooms);
  }, [prayerRooms]);

  useEffect(() => {
    localPersistenceAdapter.saveHistory(historySessions);
  }, [historySessions]);

  useEffect(() => {
    localPersistenceAdapter.saveRequests(prayerRequests);
  }, [prayerRequests]);

  useEffect(() => {
    localPersistenceAdapter.saveDataSaver(dataSaverMode);
  }, [dataSaverMode]);

  useEffect(() => {
    localPersistenceAdapter.saveTheme(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Session elapsed timer ticker
  useEffect(() => {
    if (!liveSession || liveSession.status !== 'LIVE') return;
    const interval = setInterval(() => {
      setLiveSession((prev) => {
        if (!prev || prev.status !== 'LIVE') return prev;
        return {
          ...prev,
          durationSeconds: prev.durationSeconds + 1,
          speakerDurationSeconds: (prev.speakerDurationSeconds || 0) + 1,
        };
      });

      // Update raised hand waiting seconds
      setRaisedHands((prev) =>
        prev.map((rh) => ({
          ...rh,
          waitingSeconds: rh.waitingSeconds + 1,
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [liveSession?.status]);

  const addToast = useCallback(
    (
      toastOrMessage: string | Omit<ToastItem, 'id'>,
      type: ToastType = 'info',
      title?: string
    ) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      const timeStr = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date());

      if (typeof toastOrMessage === 'string') {
        const newToast: ToastItem = {
          id,
          type,
          title: title || (type === 'error' ? 'Error' : type === 'warning' ? 'Notice' : 'Update'),
          message: toastOrMessage,
          timestamp: timeStr,
        };
        setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
      } else {
        const newToast: ToastItem = {
          ...toastOrMessage,
          id,
          timestamp: toastOrMessage.timestamp || timeStr,
        };
        setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const confirmAction = useCallback((options: ConfirmActionOptions) => {
    setConfirmModalConfig(options);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModalConfig(null);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const setDataSaverMode = (mode: DataSaverMode) => {
    setDataSaverModeState(mode);
    addToast(`Data saver mode set to ${mode.toLowerCase()}`, 'info');
  };

  // Prayer Room CRUD
  // Org-scoped slug uniqueness is enforced here until the Prisma unique index is live.
  const createPrayerRoom = (data: Omit<PrayerRoom, 'id' | 'createdAt' | 'updatedAt'>): PrayerRoom => {
    if (isMutatingRef.current) {
      throw new Error('Prayer room creation already in progress.');
    }
    isMutatingRef.current = true;
    try {
      if (isSlugTaken(prayerRooms, data.organizationId, data.slug)) {
        throw new Error('This Permanent Altar Link is already in use.');
      }

      const newRoom: PrayerRoom = {
        ...data,
        id: `room_${Date.now()}`,
        status: 'SCHEDULED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPrayerRooms((prev) => {
        if (isSlugTaken(prev, data.organizationId, data.slug)) {
          return prev;
        }
        return [newRoom, ...prev];
      });
      void sanctumApi
        .createPrayerRoom(
          {
            organizationId: data.organizationId,
            name: data.name,
            slug: data.slug,
            description: data.description,
            roomType: data.roomType,
            expectedAttendance: data.expectedAttendance,
            speakerPermission: data.speakerPermission,
            isRecurring: data.isRecurring,
            scheduledStart: data.scheduledStart,
            timezone: data.timezone,
            recordingEnabled: data.recordingEnabled,
          },
          { organizationId: data.organizationId }
        )
        .catch(() => {
          /* Database unavailable is expected until DATABASE_URL is set. */
        });
      addToast(`Created prayer room "${newRoom.name}"`, 'success');
      AuditLogger.log('ROOM_SETTINGS_CHANGED', { roomName: newRoom.name, note: 'Created new prayer room' });
      return newRoom;
    } finally {
      isMutatingRef.current = false;
    }
  };

  const updatePrayerRoom = (id: string, updates: Partial<PrayerRoom>) => {
    if (updates.slug) {
      const current = prayerRooms.find((r) => r.id === id);
      const organizationId = updates.organizationId || current?.organizationId || '';
      if (isSlugTaken(prayerRooms, organizationId, updates.slug, id)) {
        throw new Error('This Permanent Altar Link is already in use.');
      }
    }
    setPrayerRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r))
    );
    addToast('Prayer room updated', 'success');
    AuditLogger.log('ROOM_UPDATED', { targetId: id, note: 'Updated room settings' });
  };

  const deletePrayerRoom = (id: string) => {
    const target = prayerRooms.find((r) => r.id === id);
    const hasHistory = historySessions.some((session) => session.prayerRoomId === id);
    if (hasHistory) {
      setPrayerRooms((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, isArchived: true, updatedAt: new Date().toISOString() } : r
        )
      );
      addToast(`"${target?.name || 'Altar'}" was deactivated. Prayer history was preserved.`, 'info');
      return;
    }
    setPrayerRooms((prev) => prev.filter((r) => r.id !== id));
    addToast(`Prayer room "${target?.name || 'Altar'}" deleted`, 'info');
  };

  // LIFECYCLE: Open Sanctuary (WAITING State)
  const openSanctuary = (roomId: string) => {
    if (isMutatingRef.current) return;
    isMutatingRef.current = true;
    try {
      const room = prayerRooms.find((r) => r.id === roomId) || prayerRooms[0];
      if (!room) return;

      const waitingSession: PrayerSession = {
        id: `session_${Date.now()}`,
        prayerRoomId: room.id,
        roomName: room.name,
        organizationName: 'Miracle Center Kampala',
        status: 'WAITING',
        waitingRoomOpenedAt: new Date().toISOString(),
        durationSeconds: 0,
        totalUniqueParticipants: 0,
        peakConcurrentParticipants: 0,
        totalParticipants: 0,
        peakParticipants: 0,
        listenersWaitingCount: 0,
        createdAt: new Date().toISOString(),
      };

      setLiveSession(waitingSession);
      setPrayerRooms((prev) =>
        prev.map((r) => (r.id === room.id ? { ...r, status: 'WAITING' } : r))
      );

      AuditLogger.log('SANCTUARY_OPENED', {
        sessionId: waitingSession.id,
        roomName: room.name,
        note: 'Sanctuary waiting room opened for attendees',
      });

      addToast(`Sanctuary opened for "${room.name}". Members can now enter waiting sanctuary.`, 'info');
    } finally {
      isMutatingRef.current = false;
    }
  };

  // LIFECYCLE: Start Live Session (LIVE State)
  const startPrayerSession = (roomId: string) => {
    if (isMutatingRef.current) return;
    isMutatingRef.current = true;
    try {
      const room = prayerRooms.find((r) => r.id === roomId) || prayerRooms[0];
      if (!room) return;

      // Prevent starting if already live
      if (liveSession && liveSession.status === 'LIVE' && liveSession.prayerRoomId === room.id) {
        addToast(`Prayer session is already LIVE for ${room.name}`, 'info');
        return;
      }

      const newSession: PrayerSession = {
        id: liveSession?.id || `session_${Date.now()}`,
        prayerRoomId: room.id,
        roomName: room.name,
        organizationName: 'Miracle Center Kampala',
        status: 'LIVE',
        startedAt: new Date().toISOString(),
        durationSeconds: 0,
        totalUniqueParticipants: participants.length,
        peakConcurrentParticipants: participants.length,
        totalParticipants: participants.length,
        peakParticipants: participants.length,
        activeSpeakerName: undefined,
        activeSpeakerTitle: undefined,
        speakerDurationSeconds: 0,
        totalPrayerRequests: prayerRequests.length,
        totalRaisedHands: raisedHands.length,
        totalSpeakerInvitations: 0,
        totalSpeakers: 1,
        createdAt: new Date().toISOString(),
      };

      setLiveSession(newSession);
      setPrayerRooms((prev) =>
        prev.map((r) => (r.id === room.id ? { ...r, status: 'LIVE' } : r))
      );

      AuditLogger.log('SESSION_STARTED', {
        sessionId: newSession.id,
        roomName: room.name,
        note: 'Live prayer session started by Pastor Kenneth',
      });

      addToast(`🔴 Live prayer session started for "${room.name}"`, 'success');
    } finally {
      isMutatingRef.current = false;
    }
  };

  // LIFECYCLE: End Live Session (ENDING -> ENDED State)
  const endPrayerSession = async (sessionIdOrAdminId?: string, adminId?: string) => {
    if (isMutatingRef.current) return;
    isMutatingRef.current = true;
    try {
      if (!liveSession) {
        addToast('No active prayer session to end', 'info');
        return;
      }

      const actualAdminId =
        adminId || (sessionIdOrAdminId?.startsWith('admin_') || sessionIdOrAdminId?.startsWith('user_') ? sessionIdOrAdminId : 'user_pastor_kenneth');

      const apiResult = await sessionApiAdapter.endSession(liveSession.id, { userId: actualAdminId });
      if (!apiResult.ok) {
        addToast(apiResult.reason || 'Realtime Engine: Not configured', 'warning');
      }

      const endedSession: PrayerSession = {
        ...liveSession,
        status: 'ENDED',
        endedAt: new Date().toISOString(),
      };

      // Save to completed history
      setHistorySessions((prev) => [endedSession, ...prev]);
      setLiveSession(null);

      // Return room to scheduled status
      setPrayerRooms((prev) =>
        prev.map((r) => (r.id === liveSession.prayerRoomId ? { ...r, status: 'SCHEDULED' } : r))
      );

      AuditLogger.log('SESSION_ENDED', {
        sessionId: endedSession.id,
        roomName: endedSession.roomName,
        note: `Prayer session ended with ${endedSession.totalUniqueParticipants || endedSession.totalParticipants} participants`,
      });

      addToast('Live prayer session concluded and recorded safely.', 'info');
    } finally {
      isMutatingRef.current = false;
    }
  };

  // LIFECYCLE: Cancel Session
  const cancelPrayerSession = (sessionId: string) => {
    if (liveSession && liveSession.id === sessionId) {
      const targetRoomId = liveSession.prayerRoomId;
      setLiveSession(null);
      setPrayerRooms((prev) =>
        prev.map((r) => (r.id === targetRoomId ? { ...r, status: 'SCHEDULED' } : r))
      );
      AuditLogger.log('SESSION_CANCELLED', { sessionId, note: 'Session cancelled before start' });
      addToast('Prayer session cancelled', 'info');
    }
  };

  // Moderation: Invite to speak
  const inviteToPray = async (participantId: string, adminId: string = 'user_pastor_kenneth') => {
    const participant = participants.find((p) => p.id === participantId);
    const hand = raisedHands.find((h) => h.participantId === participantId);
    const name = participant?.displayName || hand?.displayName || 'Attendee';

    const apiResult = await sessionApiAdapter.inviteSpeaker(liveSession?.id, participantId, { userId: adminId });
    if (!apiResult.ok) {
      addToast(apiResult.reason || 'Realtime Engine: Not configured', 'warning');
    }

    // Update participant role to SPEAKER
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId
          ? { ...p, role: 'SPEAKER', isHandRaised: false, isMuted: false, speakingTimeSeconds: 0 }
          : p
      )
    );

    // Remove from raised hands queue
    setRaisedHands((prev) => prev.filter((h) => h.participantId !== participantId));

    // Update active speaker in session
    if (liveSession) {
      setLiveSession((prev) =>
        prev
          ? {
              ...prev,
              activeSpeakerName: name,
              activeSpeakerTitle: 'Invited Speaker',
              speakerDurationSeconds: 0,
              totalSpeakerInvitations: (prev.totalSpeakerInvitations || 0) + 1,
              totalSpeakers: (prev.totalSpeakers || 1) + 1,
            }
          : null
      );
    }

    AuditLogger.log('PARTICIPANT_INVITED_TO_SPEAK', {
      targetId: participantId,
      targetName: name,
      note: `Invited ${name} to speak in prayer`,
    });

    addToast(`Invited ${name} to speak in prayer`, 'success');
  };

  const dismissHand = (raisedHandId: string) => {
    const hand = raisedHands.find((h) => h.id === raisedHandId);
    setRaisedHands((prev) => prev.filter((h) => h.id !== raisedHandId));
    if (hand) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === hand.participantId ? { ...p, isHandRaised: false } : p))
      );
      addToast(`Dismissed hand request from ${hand.displayName}`, 'info');
    }
  };

  const muteSpeaker = async (participantId: string, adminId: string = 'user_pastor_kenneth') => {
    const target = participants.find((p) => p.id === participantId);
    addToast('Mute is applied in the Control Room preview until LiveKit is configured.', 'warning');
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, isMuted: true } : p))
    );
    AuditLogger.log('PARTICIPANT_MUTED', { targetId: participantId, targetName: target?.displayName });
    addToast(`Muted ${target?.displayName || 'speaker'}`, 'warning');
  };

  const unmuteParticipant = async (participantId: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, isMuted: false } : p))
    );
    addToast('Participant unmuted', 'success');
  };

  const endSpeaker = async (participantId: string, adminId: string = 'user_pastor_kenneth') => {
    const target = participants.find((p) => p.id === participantId);
    const apiResult = await sessionApiAdapter.revokeSpeaker(liveSession?.id, participantId, { userId: adminId });
    if (!apiResult.ok) {
      addToast(apiResult.reason || 'Realtime Engine: Not configured', 'warning');
    }

    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId ? { ...p, role: 'LISTENER', isMuted: true } : p
      )
    );

    // Reset active speaker back to Lead Pastor
    if (liveSession) {
      setLiveSession((prev) =>
        prev
          ? {
              ...prev,
              activeSpeakerName: undefined,
              activeSpeakerTitle: undefined,
            }
          : null
      );
    }

    AuditLogger.log('PARTICIPANT_RETURNED_TO_LISTENER', { targetId: participantId, targetName: target?.displayName });
    addToast(`Concluded prayer turn for ${target?.displayName || 'speaker'}`, 'info');
  };

  const removeParticipant = async (participantId: string, adminId: string = 'user_pastor_kenneth') => {
    const target = participants.find((p) => p.id === participantId);
    const apiResult = await sessionApiAdapter.removeParticipant(liveSession?.id, participantId, { userId: adminId });
    if (!apiResult.ok) {
      addToast(apiResult.reason || 'Realtime Engine: Not configured', 'warning');
    }

    setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    setRaisedHands((prev) => prev.filter((h) => h.participantId !== participantId));
    AuditLogger.log('PARTICIPANT_REMOVED', { targetId: participantId, targetName: target?.displayName });
    addToast(`Removed ${target?.displayName || 'participant'} from room`, 'info');
  };

  const updateParticipantRole = async (participantId: string, newRole: Role, adminId: string = 'user_pastor_kenneth') => {
    const target = participants.find((p) => p.id === participantId);
    addToast(`Role changes are applied in the Control Room preview until the server session is connected.`, 'warning');

    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId
          ? {
              ...p,
              role: newRole,
              isMuted: newRole === 'LISTENER' ? true : p.isMuted,
            }
          : p
      )
    );

    AuditLogger.log('ROLE_CHANGED', { targetId: participantId, targetName: target?.displayName, note: `Role changed to ${newRole}` });
    addToast(`Promoted ${target?.displayName || 'member'} to ${newRole.replace('_', ' ')}`, 'success');
  };

  // Public attendee join
  const joinPrayerRoom = async (roomSlug: string, name: string) => {
    const room = prayerRooms.find((r) => r.slug === roomSlug) || prayerRooms[0];
    const apiJoin = await sessionApiAdapter.join(liveSession?.id, name.trim());
    const newParticipantId = apiJoin.participant?.id || `p_att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const realtimeIdentity = apiJoin.participant?.realtimeIdentity;

    const newParticipant: Participant = {
      id: newParticipantId,
      sessionId: liveSession?.id || 'session_preview',
      externalIdentity: realtimeIdentity,
      displayName: name.trim(),
      role: 'LISTENER',
      joinedAt: new Date().toISOString(),
      isHandRaised: false,
      isMuted: true,
      country: 'UG',
      connectionQuality: 'OFFLINE',
    };

    setParticipants((prev) => [...prev, newParticipant]);

    if (liveSession) {
      setLiveSession((prev) =>
        prev
          ? {
              ...prev,
              totalUniqueParticipants: (prev.totalUniqueParticipants || prev.totalParticipants || 0) + 1,
              totalParticipants: (prev.totalParticipants || 0) + 1,
              peakConcurrentParticipants: Math.max(
                prev.peakConcurrentParticipants || prev.peakParticipants || 0,
                (prev.totalUniqueParticipants || prev.totalParticipants || 0) + 1
              ),
              peakParticipants: Math.max(prev.peakParticipants || 0, (prev.totalParticipants || 0) + 1),
            }
          : null
      );
    }

    if (!apiJoin.ok) {
      addToast('Realtime Engine: Not configured. Joined development preview only.', 'warning');
    }

    addToast({
      type: 'participant_join',
      title: 'Attendee Joined Gathering',
      message: `${name} entered "${room?.name || 'Prayer Room'}" as an audio listener`,
      meta: { participantName: name, roomName: room?.name },
    });

    return { participantId: newParticipantId, role: 'LISTENER' as Role };
  };

  const raiseHandAttendee = async (participantId: string, name: string) => {
    const newHand: RaisedHand = {
      id: `hand_${Date.now()}`,
      sessionId: liveSession?.id || 'session_live',
      participantId,
      displayName: name,
      status: 'WAITING',
      raisedAt: new Date().toISOString(),
      waitingSeconds: 0,
    };

    const apiResult = await sessionApiAdapter.raiseHand(liveSession?.id, participantId);
    if (!apiResult.ok) {
      addToast(apiResult.reason || 'Realtime Engine: Not configured', 'warning');
    }

    setRaisedHands((prev) => {
      if (prev.some((h) => h.participantId === participantId)) return prev;
      return [...prev, newHand];
    });
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, isHandRaised: true } : p))
    );

    addToast({
      type: 'hand_raised',
      title: 'Hand Raised for Intercession',
      message: `${name} has raised a hand in the prayer gathering queue`,
      meta: { participantName: name },
    });
  };

  const lowerHandAttendee = async (participantId: string) => {
    setRaisedHands((prev) => prev.filter((h) => h.participantId !== participantId));
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, isHandRaised: false } : p))
    );
    addToast('Hand lowered', 'info');
  };

  const sendReactionAttendee = (emoji: 'AMEN' | 'PRAISE_GOD') => {
    if (emoji === 'AMEN') {
      addToast('🙏 Amen!', 'info');
    } else {
      addToast('❤️ Praise God!', 'info');
    }
  };

  const submitPrayerRequest = (data: {
    request: string;
    isPrivate: boolean;
    participantName: string;
    roomName?: string;
  }) => {
    const newReq: PrayerRequest = {
      id: `req_${Date.now()}`,
      sessionId: liveSession?.id || 'session_live',
      participantName: data.participantName,
      request: data.request,
      isPrivate: data.isPrivate,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      roomName: data.roomName || 'Corporate Prayer Gathering',
    };

    setPrayerRequests((prev) => [newReq, ...prev]);

    const snippet = data.request.length > 55 ? `${data.request.substring(0, 55)}...` : data.request;
    addToast({
      type: 'prayer_request',
      title: data.isPrivate ? 'Confidential Pastoral Request' : 'New Altar Prayer Request',
      message: `"${snippet}" — ${data.participantName}`,
      meta: { participantName: data.participantName, roomName: data.roomName, isPrivate: data.isPrivate },
    });
  };

  const markPrayerRequestAnswered = (id: string, note?: string) => {
    setPrayerRequests((prev) =>
      prev.map((req) =>
        req.id === id
          ? {
              ...req,
              status: 'ANSWERED',
              adminNote: note || req.adminNote || 'Marked answered in prayer.',
              updatedAt: new Date().toISOString(),
            }
          : req
      )
    );
    addToast('Prayer request marked as answered / praise report', 'success');
  };

  const archivePrayerRequest = (id: string) => {
    setPrayerRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: 'ARCHIVED', updatedAt: new Date().toISOString() } : req))
    );
    addToast('Prayer request archived', 'info');
  };

  const addPrayerRequestNote = (id: string, note: string) => {
    setPrayerRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, adminNote: note, updatedAt: new Date().toISOString() } : req))
    );
    addToast('Note saved to prayer request', 'success');
  };

  // Demo simulation triggers for moderators to test alerts in real-time
  const simulateParticipantJoin = (customName?: string) => {
    const randomNames = [
      'Sarah Ninsiima',
      'Deacon David Ochieng',
      'Mary Mukasa',
      'Elder Peter Kiggundu',
      'Grace Achieng',
      'Sister Rebecca Nabirye',
      'Brother Emmanuel Kato',
      'Faith Namugga',
    ];
    const name = customName || randomNames[Math.floor(Math.random() * randomNames.length)];
    joinPrayerRoom(prayerRooms[0]?.slug || 'morning-prayer', name);
  };

  const simulateIncomingPrayerRequest = (customRequest?: string) => {
    const samples = [
      { text: 'Praying for my mother undergoing surgery this morning in Kampala.', isPrivate: false, name: 'Sister Faith' },
      { text: 'Confidential request: Pastoral guidance regarding family reconciliation.', isPrivate: true, name: 'Anonymous Member' },
      { text: 'Interceding for breakthrough in youth ministry and campus outreach.', isPrivate: false, name: 'Joshua Tumusiime' },
      { text: 'Praise report! Healing from persistent fever after Friday intercession.', isPrivate: false, name: 'Dorothy Namutebi' },
    ];
    const sample = samples[Math.floor(Math.random() * samples.length)];
    submitPrayerRequest({
      request: customRequest || sample.text,
      isPrivate: sample.isPrivate,
      participantName: sample.name,
      roomName: prayerRooms[0]?.name || 'Morning Prayer',
    });
  };

  const allPrayerSessions = [
    ...(liveSession ? [liveSession] : []),
    ...scheduledSessions,
    ...historySessions,
  ];

  return (
    <AppContext.Provider
      value={{
        prayerRooms: prayerRooms || [],
        prayerSessions: allPrayerSessions,
        historySessions: historySessions || [],
        liveSession,
        participants: participants || [],
        raisedHands: raisedHands || [],
        prayerRequests: prayerRequests || [],
        dataSaverMode,
        isDarkMode,
        toasts: toasts || [],
        confirmModalConfig,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        toggleDarkMode,
        setDataSaverMode,
        addToast,
        removeToast,
        confirmAction,
        closeConfirmModal,
        createPrayerRoom,
        updatePrayerRoom,
        deletePrayerRoom,
        openSanctuary,
        startPrayerSession,
        endPrayerSession,
        cancelPrayerSession,
        startLiveSession: startPrayerSession,
        endLiveSession: endPrayerSession,
        inviteToPray,
        inviteSpeaker: inviteToPray,
        dismissHand,
        dismissRaisedHand: dismissHand,
        muteSpeaker,
        muteParticipant: muteSpeaker,
        unmuteParticipant,
        endSpeaker,
        removeParticipant,
        updateParticipantRole,
        assignRole: updateParticipantRole,
        joinPrayerRoom,
        raiseHandAttendee,
        lowerHandAttendee,
        sendReactionAttendee,
        submitPrayerRequest,
        markPrayerRequestAnswered,
        archivePrayerRequest,
        addPrayerRequestNote,
        addNoteToPrayerRequest: addPrayerRequestNote,
        simulateParticipantJoin,
        simulateIncomingPrayerRequest,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

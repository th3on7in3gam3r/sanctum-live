import React from 'react';
import { Mic, MicOff, VolumeX, Volume2 } from 'lucide-react';
import type { Participant, Role } from '../../types';

const MINISTER_ROLES: Role[] = ['OWNER', 'ADMIN', 'PRAYER_LEADER', 'TECHNICAL_ADMIN'];

function isMinister(role: Role): boolean {
  return MINISTER_ROLES.includes(role);
}

interface CongregationRosterProps {
  participants: Participant[];
  micOnByIdentity: Record<string, boolean>;
  localIdentity?: string | null;
  canMute: boolean;
  discussionOpen: boolean;
  onMute: (participantId: string) => void;
  onUnmute: (participantId: string) => void;
}

export const CongregationRoster: React.FC<CongregationRosterProps> = ({
  participants,
  micOnByIdentity,
  localIdentity,
  canMute,
  discussionOpen,
  onMute,
  onUnmute,
}) => {
  const congregation = participants
    .filter((person) => !person.leftAt && !isMinister(person.role))
    .filter((person) => !localIdentity || person.externalIdentity !== localIdentity)
    .map((person) => ({
      ...person,
      micOn: Boolean(person.externalIdentity && micOnByIdentity[person.externalIdentity]),
    }))
    .sort((a, b) => {
      if (a.micOn !== b.micOn) return a.micOn ? -1 : 1;
      return a.displayName.localeCompare(b.displayName);
    });

  const unmutedCount = congregation.filter((person) => person.micOn).length;

  return (
    <div className="bg-white dark:bg-[#17221D] p-4 sm:p-5 rounded-3xl border border-[#E5E6E1] dark:border-[#26362F] shadow-xs">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-bold text-[#16251F] dark:text-[#F8F7F3]">
            Congregation ({congregation.length})
          </h3>
          <p className="text-xs text-[#68736D] dark:text-[#96A39D] mt-0.5">
            {discussionOpen
              ? 'Discussion is open. Mute someone if their mic stays on. Allow to speak lets them unmute on their phone.'
              : 'Congregation is muted for opening prayer. Mute still works if someone has a mic on.'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              discussionOpen
                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                : 'bg-[#B94A48]/10 text-[#B94A48]'
            }`}
          >
            {discussionOpen ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
            {discussionOpen ? 'Mics allowed' : 'Mics locked'}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              unmutedCount > 0
                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                : 'bg-black/5 dark:bg-white/5 text-[#68736D] dark:text-[#96A39D]'
            }`}
          >
            {unmutedCount} live now
          </span>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5">
        {congregation.length === 0 && (
          <p className="text-xs text-[#68736D] dark:text-[#96A39D] py-8 text-center">
            No congregants have joined yet. They enter their name at the public join link.
          </p>
        )}

        {congregation.map((person) => (
          <div
            key={person.id}
            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl border ${
              person.micOn
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/80 dark:bg-[#101814]/50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#203C32]/10 dark:bg-[#C9A35A]/15 text-[#203C32] dark:text-[#C9A35A] flex items-center justify-center font-bold text-[10px] shrink-0">
                {person.displayName.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#16251F] dark:text-[#F8F7F3] truncate">
                  {person.displayName}
                </p>
                <p
                  className={`text-[11px] font-semibold flex items-center gap-1 ${
                    person.micOn
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-[#68736D] dark:text-[#96A39D]'
                  }`}
                >
                  {person.micOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                  {person.micOn ? 'Microphone on' : 'Mic off'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {canMute && person.micOn && (
                <button
                  type="button"
                  onClick={() => onMute(person.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-[#B94A48] hover:bg-red-700 text-white cursor-pointer"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  Mute
                </button>
              )}

              {canMute && !person.micOn && discussionOpen && (
                <button
                  type="button"
                  onClick={() => onUnmute(person.id)}
                  title="Allows this person to turn on their microphone. They must tap Unmute on their phone."
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Allow to speak
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

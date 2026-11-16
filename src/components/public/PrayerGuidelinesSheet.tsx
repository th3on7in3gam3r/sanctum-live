import React from 'react';
import { ShieldCheck, X } from 'lucide-react';

/** Same guidelines sheet as PLCC Jordan's prayer room (styles from prayer-room.css). */
export function PrayerGuidelinesSheet({ onClose }: { onClose: () => void }) {
  const rules = [
    'This is an audio prayer room. Join with headphones if you can.',
    'Everyone joins muted. Stay muted unless a moderator invites you to pray.',
    'Raise your hand to ask to pray. A moderator will invite you.',
    'Keep every prayer respectful, focused and kind.',
    'Never share private details about other people.',
    'This overflow room opens when the main Jordan room is full.',
    'Moderators may mute or remove anyone to keep the room safe.',
  ];
  return (
    <div className="pr-sheet-backdrop" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Prayer room guidelines" className="pr-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2.5 text-lg font-extrabold">
            <span className="pr-info-icon"><ShieldCheck size={15} aria-hidden /></span>
            Prayer room guidelines
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full hover:bg-black/5">
            <X size={18} aria-hidden />
          </button>
        </div>
        <ol className="mt-4 space-y-3">
          {rules.map((rule, n) => (
            <li key={rule} className="flex gap-3 text-[15px] leading-snug">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1d58a] text-xs font-black">{n + 1}</span>
              {rule}
            </li>
          ))}
        </ol>
        <button type="button" onClick={onClose} className="mt-5 min-h-[48px] w-full cursor-pointer rounded-2xl bg-[#0f3d2c] font-bold text-white">
          I understand
        </button>
      </div>
    </div>
  );
}

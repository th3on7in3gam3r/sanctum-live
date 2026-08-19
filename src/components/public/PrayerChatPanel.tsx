import React, { useEffect, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { livekitRealtimeProvider } from '../../services/realtime/livekitRealtimeProvider';

export interface ChatMessage {
  id: string;
  displayName: string;
  body: string;
  timestamp: string;
}

interface PrayerChatPanelProps {
  sessionId?: string;
  senderName: string;
  compact?: boolean;
}

export const PrayerChatPanel: React.FC<PrayerChatPanelProps> = ({
  sessionId,
  senderName,
  compact = false,
}) => {
  const [open, setOpen] = useState(!compact);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    return livekitRealtimeProvider.subscribe((event) => {
      if (event.type !== 'CHAT_MESSAGE') return;
      const body = typeof event.metadata?.body === 'string' ? event.metadata.body : '';
      if (!body) return;
      setMessages((prev) => [
        ...prev.slice(-99),
        {
          id: `${event.timestamp}-${prev.length}`,
          displayName: event.displayName || 'Attendee',
          body,
          timestamp: event.timestamp,
        },
      ]);
    });
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim().slice(0, 240);
    if (!body || !sessionId) return;
    await livekitRealtimeProvider.sendChatMessage(sessionId, senderName, body);
    setDraft('');
  };

  return (
    <div className="rounded-2xl border border-[#E5E6E1] dark:border-[#26362F] bg-white dark:bg-[#17221D] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-[#16251F] dark:text-[#F8F7F3] cursor-pointer"
      >
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-[#C9A35A]" />
          Gathering chat
        </span>
        <span className="text-[10px] text-[#68736D]">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="border-t border-[#E5E6E1] dark:border-[#26362F] p-3 space-y-2">
          <div className={`${compact ? 'max-h-40' : 'max-h-56'} overflow-y-auto space-y-1.5 text-xs`}>
            {messages.length === 0 && (
              <p className="text-[#68736D] dark:text-[#96A39D]">No messages yet. Keep the altar chat brief.</p>
            )}
            {messages.map((message) => (
              <div key={message.id}>
                <span className="font-bold text-[#203C32] dark:text-[#C9A35A]">{message.displayName}: </span>
                <span className="text-[#16251F] dark:text-[#F8F7F3]">{message.body}</span>
              </div>
            ))}
          </div>
          <form onSubmit={(e) => void send(e)} className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={240}
              placeholder="Share a short prayer note…"
              className="flex-1 px-3 py-2 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-xs"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-[#203C32] text-white dark:bg-[#C9A35A] dark:text-[#101814] cursor-pointer"
              aria-label="Send chat"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

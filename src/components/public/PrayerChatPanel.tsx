import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { livekitRealtimeProvider } from '../../services/realtime/livekitRealtimeProvider';
import { loadJoinSession } from '../../services/realtime/joinSessionStore';
import { useApp } from '../../context/AppContext';

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

function appendMessage(prev: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  if (
    prev.some(
      (item) =>
        item.timestamp === incoming.timestamp &&
        item.body === incoming.body &&
        item.displayName === incoming.displayName
    )
  ) {
    return prev;
  }
  return [...prev.slice(-99), incoming];
}

export const PrayerChatPanel: React.FC<PrayerChatPanelProps> = ({
  sessionId,
  senderName,
  compact = false,
}) => {
  const { addToast, connectionState } = useApp();
  const [open, setOpen] = useState(!compact);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const connected = connectionState === 'CONNECTED' || connectionState === 'RECONNECTING';

  useEffect(() => {
    return livekitRealtimeProvider.subscribe((event) => {
      if (event.type !== 'CHAT_MESSAGE') return;
      const body = typeof event.metadata?.body === 'string' ? event.metadata.body.trim() : '';
      if (!body) return;
      setMessages((prev) =>
        appendMessage(prev, {
          id: `${event.timestamp}-${event.displayName}-${body}`,
          displayName: event.displayName || 'Attendee',
          body,
          timestamp: event.timestamp,
        })
      );
    });
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim().slice(0, 240);
    if (!body || sending) return;
    const resolvedSessionId = sessionId || loadJoinSession()?.sessionId || '';
    setSending(true);
    try {
      await livekitRealtimeProvider.sendChatMessage(resolvedSessionId, senderName.trim() || 'Attendee', body);
      setDraft('');
    } catch {
      addToast('Chat could not send. Stay connected to the gathering and try again.', 'error');
    } finally {
      setSending(false);
    }
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
          <div
            ref={listRef}
            className={`${compact ? 'max-h-40' : 'max-h-56'} overflow-y-auto space-y-1.5 text-xs`}
          >
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
              placeholder={connected ? 'Share a short prayer note…' : 'Connect to the gathering to chat'}
              disabled={!connected || sending}
              className="flex-1 px-3 py-2 rounded-xl border border-[#E5E6E1] dark:border-[#26362F] bg-[#F8F7F3]/70 dark:bg-[#101814] text-xs disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!connected || sending || !draft.trim()}
              className="p-2 rounded-xl bg-[#203C32] text-white dark:bg-[#C9A35A] dark:text-[#101814] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

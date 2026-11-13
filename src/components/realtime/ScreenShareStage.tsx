import { useEffect, useRef, useState } from 'react';
import { Maximize2, MonitorUp, MonitorX, Loader2 } from 'lucide-react';
import { livekitRealtimeProvider, type ScreenShareInfo } from '../../services/realtime/livekitRealtimeProvider';

/** Current screen share from the live room, kept in sync with LiveKit events. */
export function useScreenShare(): ScreenShareInfo | null {
  const [info, setInfo] = useState<ScreenShareInfo | null>(() => livekitRealtimeProvider.getScreenShare());
  useEffect(() => {
    setInfo(livekitRealtimeProvider.getScreenShare());
    return livekitRealtimeProvider.subscribe((event) => {
      if (event.type === 'SCREEN_SHARE_CHANGED' || event.type === 'DISCONNECTED') {
        setInfo(livekitRealtimeProvider.getScreenShare());
      }
    });
  }, []);
  return info;
}

/**
 * The shared screen, shown to everyone in the room (and as a preview to the presenter).
 * Renders nothing when nobody is sharing.
 */
export function ScreenShareStage({ className = '' }: { className?: string }) {
  const info = useScreenShare();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!info || !el) return;
    const detach = livekitRealtimeProvider.attachScreenShare(el);
    void el.play().catch(() => undefined);
    return detach;
  }, [info]);

  if (!info) return null;

  const label = info.isLocal ? 'You are sharing your screen' : `${info.name || 'The host'} is sharing their screen`;

  const goFullscreen = () => {
    const el = frameRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => undefined);
  };

  return (
    <section
      aria-label={label}
      className={`rounded-3xl border border-line bg-card overflow-hidden shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink min-w-0">
          <span className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </p>
        <button
          type="button"
          onClick={goFullscreen}
          aria-label="Full screen"
          className="min-h-[36px] min-w-[36px] rounded-xl border border-line flex items-center justify-center text-muted hover:text-ink cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
      <div ref={frameRef} className="bg-black aspect-video w-full flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
      </div>
      {info.isLocal ? (
        <p className="px-4 py-2.5 text-xs text-muted">
          This is what the congregation sees. Use your browser&apos;s &quot;Stop sharing&quot; bar or the button
          here to end it.
        </p>
      ) : null}
    </section>
  );
}

/** Share / stop-sharing button for hosts and moderators. */
export function ScreenShareButton({
  disabled,
  onError,
  onStarted,
  className = '',
}: {
  disabled?: boolean;
  onError?: (message: string) => void;
  onStarted?: () => void;
  className?: string;
}) {
  const info = useScreenShare();
  const [busy, setBusy] = useState(false);
  const sharing = Boolean(info?.isLocal);
  const someoneElse = Boolean(info && !info.isLocal);
  const supported = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getDisplayMedia);

  const toggle = async () => {
    setBusy(true);
    try {
      if (sharing) {
        await livekitRealtimeProvider.stopScreenShare();
      } else {
        await livekitRealtimeProvider.startScreenShare();
        if (livekitRealtimeProvider.getScreenShare()?.isLocal) onStarted?.();
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not share your screen.');
    } finally {
      setBusy(false);
    }
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={disabled || busy || someoneElse}
      title={someoneElse ? `${info?.name || 'Someone'} is already sharing` : undefined}
      className={`min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
        sharing
          ? 'bg-danger hover:bg-red-700 text-white'
          : 'border border-line bg-card text-ink hover:border-green dark:hover:border-gold'
      } ${className}`}
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : sharing ? (
        <MonitorX className="w-4 h-4" />
      ) : (
        <MonitorUp className="w-4 h-4" />
      )}
      <span>{sharing ? 'Stop sharing' : 'Share screen'}</span>
    </button>
  );
}

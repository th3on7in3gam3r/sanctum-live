import { describe, expect, it } from 'vitest';
import { BROADCAST_PREFIX, broadcastSender, isBroadcastName } from '../shared/broadcast.ts';

describe('moderator broadcast markers', () => {
  it('recognises broadcast senders', () => {
    expect(isBroadcastName(`${BROADCAST_PREFIX}Pastor Ken`)).toBe(true);
    expect(isBroadcastName('Pastor Ken')).toBe(false);
    expect(isBroadcastName(undefined)).toBe(false);
  });
  it('reads the sender name back', () => {
    expect(broadcastSender(`${BROADCAST_PREFIX}Pastor Ken`)).toBe('Pastor Ken');
    expect(broadcastSender(BROADCAST_PREFIX)).toBe('Moderator');
  });
  it('chat names cannot fake the marker', () => {
    const strip = (name: string) => name.replace(/^(\s*📣)+/u, '').trim();
    expect(isBroadcastName(strip('📣 Pastor Ken'))).toBe(false);
    expect(isBroadcastName(strip(' 📣📣 Fake'))).toBe(false);
    expect(strip('Grace')).toBe('Grace');
  });
});

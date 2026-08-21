import { useCallback, useEffect, useRef } from 'react';
import type { TourId } from '../tour/tourIds';
import type { TourStep } from '../tour/createTour';
import { startTour } from '../tour/createTour';
import { hasCompletedTour, resetTour } from '../tour/tourStorage';

interface UseTourOptions {
  /** Delay before auto-start so the page can paint anchors. */
  delayMs?: number;
  /** When false, skip auto-start (still allow manual startTour). */
  enabled?: boolean;
}

/**
 * Auto-starts a tour once per browser if not completed.
 * Returns startTour() for Help / Show tutorial replay.
 */
export function useTour(tourId: TourId, steps: TourStep[], options: UseTourOptions = {}) {
  const { delayMs = 600, enabled = true } = options;
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const startedRef = useRef(false);

  const runTour = useCallback(
    (force = false) => {
      if (force) resetTour(tourId);
      return startTour(tourId, stepsRef.current);
    },
    [tourId]
  );

  useEffect(() => {
    if (!enabled) return;
    if (hasCompletedTour(tourId)) return;
    if (startedRef.current) return;

    const timer = window.setTimeout(() => {
      if (startedRef.current) return;
      if (hasCompletedTour(tourId)) return;
      const started = startTour(tourId, stepsRef.current);
      if (started) startedRef.current = true;
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [tourId, delayMs, enabled]);

  return { startTour: () => runTour(true) };
}

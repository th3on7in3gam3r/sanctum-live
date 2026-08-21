export const TOUR_IDS = {
  dashboard: 'dashboard',
  controlRoom: 'controlRoom',
  listenerRoom: 'listenerRoom',
  joinGate: 'joinGate',
} as const;

export type TourId = (typeof TOUR_IDS)[keyof typeof TOUR_IDS];

import { driver, type DriveStep, type Config } from 'driver.js';
import type { TourId } from './tourIds';
import { markTourComplete } from './tourStorage';

export type TourStep = DriveStep & {
  /** Stable selector; step is skipped if the element is missing. */
  element?: string;
};

function filterAvailableSteps(steps: TourStep[]): DriveStep[] {
  return steps.filter((step) => {
    if (!step.element) return true;
    return Boolean(document.querySelector(step.element));
  });
}

export function createTour(tourId: TourId, steps: TourStep[], overrides?: Config) {
  const available = filterAvailableSteps(steps);
  if (available.length === 0) return null;

  const instance = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayOpacity: 0.55,
    stagePadding: 10,
    stageRadius: 12,
    popoverClass: 'sanctum-tour-popover',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    progressText: '{{current}} of {{total}}',
    steps: available,
    onDestroyed: () => {
      markTourComplete(tourId);
    },
    ...overrides,
  });

  return instance;
}

export function startTour(tourId: TourId, steps: TourStep[], overrides?: Config): boolean {
  const instance = createTour(tourId, steps, overrides);
  if (!instance) return false;
  instance.drive();
  return true;
}

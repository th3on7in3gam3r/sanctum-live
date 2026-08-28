import type { TourStep } from './createTour';

export const listenerRoomTourSteps: TourStep[] = [
  {
    element: '[data-tour="listener-welcome"]',
    popover: {
      title: 'You are in the prayer gathering',
      description:
        'No account needed. Listen along, send Amen, raise your hand, or type in chat. Your pastor leads from their Control Room.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="listener-enable-audio"]',
    popover: {
      title: 'Can’t hear anything?',
      description: 'Tap Enable Prayer Audio. Phones often block sound until you tap once.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="listener-reactions"]',
    popover: {
      title: 'React and raise your hand',
      description:
        'Tap Amen or Praise God to encourage others. Raise Hand if you would like to be invited to pray aloud.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="listener-chat"]',
    popover: {
      title: 'Gathering chat',
      description: 'Type a short message here. Everyone in the gathering can see it.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="listener-mic"]',
    popover: {
      title: 'Tap to speak',
      description:
        'When Discussion PTT is open, tap this button to talk. Tap again to stop so someone else can speak.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="listener-mic-locked"]',
    popover: {
      title: 'Microphone stays off for now',
      description:
        'During Sermon mode your mic stays off. When the pastor opens Discussion PTT, Tap to speak will appear.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="listener-leave"]',
    popover: {
      title: 'Leaving',
      description:
        'Tap Leave when you are done. You can open this guide again anytime with the Help button.',
      side: 'bottom',
      align: 'end',
    },
  },
];

export const joinGateTourSteps: TourStep[] = [
  {
    element: '[data-tour="join-name"]',
    popover: {
      title: 'Type your name, then join',
      description:
        'Enter the name people know you by, then tap Join Prayer. You do not need an account.',
      side: 'bottom',
      align: 'center',
    },
  },
];

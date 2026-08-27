import type { TourStep } from './createTour';

export const controlRoomTourSteps: TourStep[] = [
  {
    element: '[data-tour="control-welcome"]',
    popover: {
      title: 'You are in the Control Room',
      description:
        'Lead prayer from here. Your congregation joins the public link as listeners. You stay on this screen to host.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="control-start"]',
    popover: {
      title: 'Start the gathering',
      description:
        'When the sanctuary is waiting, tap Start Prayer to go live. Use Pre-Prayer Check first if you want to test your mic.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '[data-tour="control-host-mic"]',
    popover: {
      title: 'Turn on your microphone',
      description:
        'Tap this so the congregation can hear you. Your browser may ask for permission the first time — tap Allow.',
      side: 'top',
      align: 'end',
    },
  },
  {
    element: '[data-tour="control-congregation-mute"]',
    popover: {
      title: 'Sermon or Discussion PTT',
      description:
        'Sermon mode keeps the room listen-only. Open Discussion PTT so congregants can press and hold to speak, one at a time.',
      side: 'top',
      align: 'end',
    },
  },
  {
    element: '[data-tour="control-roster"]',
    popover: {
      title: 'Congregation list',
      description:
        'See who joined. Green mic means live, red means ready for PTT, grey means locked. Press and hold a name for private prayer with that person.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="control-raised-hands"]',
    popover: {
      title: 'Raised hands',
      description:
        'When someone raises their hand to pray, they appear here. Invite them when you are ready for a longer prayer turn.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="control-chat-tab"]',
    popover: {
      title: 'Gathering chat',
      description: 'Open Chat to read and send messages during the gathering.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="control-end"]',
    popover: {
      title: 'End when you are done',
      description:
        'Tap End Prayer Session to close the gathering for everyone. You can replay this guide anytime with the Help button.',
      side: 'bottom',
      align: 'end',
    },
  },
];

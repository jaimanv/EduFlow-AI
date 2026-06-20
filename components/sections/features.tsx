const features = [
  {
    title: 'Weekly Timetable',
    details:
      'Plan your weekly lectures, study blocks, and assignments. Stay on top of your schedule with a clean, intuitive, and interactive layout.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    accent: '#6EE7D8',
    accentBg: 'rgba(110,231,216,0.10)',
    tag: 'Schedule',
    href: '/dashboard/timetable',
  },
  {
    title: 'Study Rooms',
    details:
      'Join or host collaborative virtual environments. Study together with peers, share resources, and keep each other accountable in real-time.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m21-2a4 4 0 00-3-3.87m-4-12a4 4 0 110 7.75" />
      </svg>
    ),
    accent: '#14B8A6',
    accentBg: 'rgba(20,184,166,0.10)',
    tag: 'Community',
    href: '/dashboard/study-rooms',
  },
  {
    title: 'AI Recommender',
    details:
      'Get personalized resource suggestions, study insights, and material updates driven by advanced algorithms tailored to your curriculum.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    accent: '#5EEAD4',
    accentBg: 'rgba(94,234,212,0.10)',
    tag: 'AI-Powered',
    href: '/dashboard/ai-recommender',
  },
  {
    title: 'Productivity Tracker',
    details:
      'Visualise your focus time, streaks, and completion rates. Stay consistent with gentle nudges and weekly insights.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    accent: '#6EE7D8',
    accentBg: 'rgba(110,231,216,0.08)',
    tag: 'Insights',
    href: '/dashboard/productivity',
  },
  {
    title: 'Mood Tracker',
    details:
      'Track your daily mood, reflect on patterns, and build healthier study habits with simple emotional check-ins.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    accent: '#14B8A6',
    accentBg: 'rgba(20,184,166,0.08)',
    tag: 'Wellness',
    href: '/dashboard/mood',
  },
  {
    title: 'Weekly Productivity Graph',
    details:
      'Monitor your progress with beautifully rendered visual analytics. Track trends, analyze focus hours, and stay completely consistent.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} 
          d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    accent: '#5EEAD4',
    accentBg: 'rgba(94,234,212,0.10)',
    tag: 'Analytics',
    href: '/dashboard/productivity',
  },
];


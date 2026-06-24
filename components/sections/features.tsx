import Link from "next/link";
import React from "react";

const features = [
  // --- ORIGINAL 5 FEATURES ---
  {
    title: 'Study Planner',
    href: '/dashboard/study-planner',
    details:
      'Organise your entire semester in minutes. Set tasks, deadlines, and daily goals — and let AI optimise your schedule automatically.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    accent: '#14B8A6',
    accentBg: 'rgba(20,184,166,0.10)',
    tag: 'Planning',
  },
  {
    title: 'AI Doubt Solver',
    href: '/dashboard/doubt-solver',
    details:
      'Ask any academic question and get clear, instant explanations with examples — across every subject, 24 hours a day.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    accent: '#14B8A6',
    accentBg: 'rgba(20,184,166,0.10)',
    tag: 'AI-Powered',
  },
  {
    title: 'Notes Generator',
    href: '/dashboard/notes',
    details:
      'Paste any lecture or topic and get structured, revision-ready notes in seconds. Clean formatting. Zero effort.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    accent: '#14B8A6',
    accentBg: 'rgba(20,184,166,0.10)',
    tag: 'Notes',
  },
  {
    title: 'Productivity Tracker',
    href: '/dashboard/productivity',
    details:
      'Visualise your focus time, streaks, and completion rates. Stay consistent with gentle nudges and weekly insights.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    accent: '#14B8A6',
    accentBg: 'rgba(20,184,166,0.10)',
    tag: 'Insights',
  },
  {
    title: 'Mood Tracker',
    href: '/dashboard/mood',
    details:
      'Track your daily mood, reflect on patterns, and build healthier study habits with simple emotional check-ins.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    accent: '#14B8A6',
    accentBg: 'rgba(20,184,166,0.10)',
    tag: 'Wellness',
  },

  // --- NEW 3 FEATURES ---
  {
    title: 'Weekly Timetable',
    href: '/dashboard/timetable',
    details:
      'Plan your weekly lectures, study blocks, and assignments. Stay on top of your schedule with a clean, intuitive, and interactive layout.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    accent: '#14B8A6',
    accentBg: 'rgba(20,184,166,0.10)',
    tag: 'Schedule',
  },
  {
    title: 'Study Rooms',
    href: '/dashboard/study-rooms',
    details:
      'Join or host collaborative virtual environments. Study together with peers, share resources, and keep each other accountable in real-time.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m21-2a4 4 0 00-3-3.87m-4-12a4 4 0 110 7.75" />
      </svg>
    ),
    accent: '#14B8A6',
    accentBg: 'rgba(20,184,166,0.10)',
    tag: 'Community',
  },
  {
    title: 'AI Recommender',
    href: '/dashboard/ai_recommender',
    details:
      'Get personalized resource suggestions, study insights, and material updates driven by advanced algorithms tailored to your curriculum.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    accent: '#14B8A6',
    accentBg: 'rgba(20,184,166,0.10)',
    tag: 'AI-Powered',
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
            Everything a student needs to <span className="text-[#14B8A6]">actually excel</span>
          </h2>
          <p className="text-slate-500 text-lg">
            No switching apps. No friction. Just one beautifully designed space that keeps you organised, focused, and one step ahead.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Link
              key={index}
              href={feature.href}
              aria-label={`Open ${feature.title}`}
              className="group relative p-8 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: feature.accentBg, color: feature.accent }}
                  >
                    {feature.icon}
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#14B8A6]">
                    {feature.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.details}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
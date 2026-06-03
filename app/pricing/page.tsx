"use client";

import Link from "next/link";

export default function PricingPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 pt-24 pb-12"
      style={{ background: "var(--ui-bg)" }}
    >
      <div className="max-w-2xl w-full text-center">
        <div
          className="rounded-2xl p-12 border"
          style={{ background: "var(--ui-surface)", borderColor: "var(--ui-border)" }}
        >
          <h1
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: "var(--ui-heading)" }}
          >
            This page is no longer used
          </h1>
          <p className="text-lg mb-8" style={{ color: "var(--ui-muted)" }}>
            Pricing information has been updated. Please visit the dashboard or
            home page for more information.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#14b8a6] to-[#6ee7d8] text-white shadow-[0_4px_12px_rgba(20,184,166,0.22)] hover:shadow-[0_10px_22px_rgba(20,184,166,0.32)] hover:-translate-y-0.5 transition-all duration-200"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { memo, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { Recommendation } from "@/hooks/useRecommendations";

// ---------- Icon map by recommendation type ----------

const typeIcons: Record<string, { icon: React.ReactNode; gradient: string }> = {
  subject_priority: {
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  },
  weak_area: {
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
  },
  optimal_time: {
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, #14b8a6, #0d9488)",
  },
  break_suggestion: {
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, #10b981, #34d399)",
  },
  streak_protection: {
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3c1.4 2.7.9 4.8-.6 6.3-1.1 1.1-1.7 2.3-1.7 3.8a3.3 3.3 0 106.6 0c0-2.1-1.1-3.9-3.3-5.4m-1-4.7C7.6 5.8 5 9.5 5 13.4a7 7 0 0014 0c0-3.5-1.8-6.6-5.3-9.4" />
      </svg>
    ),
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
  },
};

const defaultTypeIcon = {
  icon: (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  gradient: "linear-gradient(135deg, #6EE7D8, #14B8A6)",
};

const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
  high: {
    bg: "rgba(239,68,68,0.08)",
    text: "#f87171",
    border: "rgba(239,68,68,0.18)",
  },
  medium: {
    bg: "rgba(245,158,11,0.08)",
    text: "#fbbf24",
    border: "rgba(245,158,11,0.18)",
  },
  low: {
    bg: "rgba(110,231,216,0.08)",
    text: "#6EE7D8",
    border: "rgba(110,231,216,0.18)",
  },
};

const typeLabels: Record<string, string> = {
  subject_priority: "Subject Priority",
  weak_area: "Weak Area",
  optimal_time: "Best Study Time",
  break_suggestion: "Break Needed",
  streak_protection: "Streak Alert",
};

// ---------- Single recommendation item ----------

const RecommendationItem = memo(function RecommendationItem({
  rec,
  index,
}: {
  rec: Recommendation;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const { icon, gradient } = typeIcons[rec.type] ?? defaultTypeIcon;
  const priorityColor = priorityColors[rec.priority] ?? priorityColors.medium;
  const typeLabel = typeLabels[rec.type] ?? rec.type;

  return (
    <div
      className="group relative rounded-xl transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--ui-border)",
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: gradient,
              color: "#fff",
              boxShadow: `0 4px 14px ${gradient.includes("f59e0b") ? "rgba(245,158,11,0.25)" : "rgba(20,184,166,0.25)"}`,
            }}
          >
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={{
                  background: priorityColor.bg,
                  color: priorityColor.text,
                  border: `1px solid ${priorityColor.border}`,
                }}
              >
                {rec.priority}
              </span>
              <span
                className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(110,231,216,0.06)",
                  color: "var(--ui-muted)",
                  border: "1px solid rgba(110,231,216,0.12)",
                }}
              >
                {typeLabel}
              </span>
            </div>

            <h3
              className="text-sm font-bold leading-snug"
              style={{ color: "var(--ui-heading)" }}
            >
              {rec.title}
            </h3>
            <p
              className="text-xs leading-relaxed mt-1"
              style={{ color: "var(--ui-text)" }}
            >
              {rec.message}
            </p>

            {/* Actions row */}
            <div className="flex items-center gap-3 mt-3">
              {rec.actionHref && rec.actionLabel && (
                <Link
                  href={rec.actionHref}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150"
                  style={{
                    background: "linear-gradient(135deg, #6EE7D8, #14B8A6)",
                    color: "#0d2420",
                    boxShadow: "0 2px 8px rgba(110,231,216,0.25)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 4px 14px rgba(110,231,216,0.4)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(110,231,216,0.25)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {rec.actionLabel}
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              )}

              {rec.reason && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="inline-flex items-center gap-1 text-[10px] font-medium transition-colors duration-150"
                  style={{ color: "var(--ui-muted)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#6EE7D8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--ui-muted)";
                  }}
                >
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  Why this recommendation?
                </button>
              )}
            </div>

            {/* Expandable reason */}
            {expanded && rec.reason && (
              <div
                className="mt-3 rounded-lg p-3 text-[11px] leading-relaxed animate-in fade-in"
                style={{
                  background: "rgba(110,231,216,0.04)",
                  border: "1px solid rgba(110,231,216,0.10)",
                  color: "var(--ui-muted)",
                }}
              >
                <span
                  className="font-semibold"
                  style={{ color: "var(--ui-text)" }}
                >
                  Why:{" "}
                </span>
                {rec.reason}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ---------- Skeleton loader ----------

const skeletonItems = [0, 1, 2];

function RecommendationSkeleton() {
  return (
    <div className="space-y-3">
      {skeletonItems.map((i) => (
        <div
          key={i}
          className="rounded-xl p-4 animate-pulse"
          style={{
            background: "rgba(110,231,216,0.03)",
            border: "1px solid var(--ui-border)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-xl flex-shrink-0"
              style={{ background: "rgba(110,231,216,0.10)" }}
            />
            <div className="flex-1 space-y-2.5">
              <div className="flex gap-2">
                <div
                  className="h-4 w-12 rounded-full"
                  style={{ background: "rgba(110,231,216,0.08)" }}
                />
                <div
                  className="h-4 w-20 rounded-full"
                  style={{ background: "rgba(110,231,216,0.06)" }}
                />
              </div>
              <div
                className="h-4 w-3/4 rounded"
                style={{ background: "rgba(110,231,216,0.08)" }}
              />
              <div
                className="h-3.5 w-full rounded"
                style={{ background: "rgba(110,231,216,0.05)" }}
              />
              <div
                className="h-3.5 w-5/6 rounded"
                style={{ background: "rgba(110,231,216,0.04)" }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Main card component ----------

type RecommendationCardProps = {
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;
  generatedAt: string | null;
  rawInsight: string | null;
  onRefresh: () => void;
};

export default memo(function RecommendationCard({
  recommendations,
  loading,
  error,
  generatedAt,
  rawInsight,
  onRefresh,
}: RecommendationCardProps) {
  const handleRefreshEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.boxShadow = "0 4px 14px rgba(110,231,216,0.35)";
      e.currentTarget.style.transform = "translateY(-1px)";
    },
    [],
  );
  const handleRefreshLeave = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.boxShadow = "0 3px 10px rgba(110,231,216,0.22)";
      e.currentTarget.style.transform = "translateY(0)";
    },
    [],
  );

  const formattedTime = useMemo(() => {
    if (!generatedAt) return null;
    try {
      const d = new Date(generatedAt);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  }, [generatedAt]);

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-teal-700/20 bg-[linear-gradient(135deg,rgba(240,253,250,0.98)_0%,rgba(204,251,241,0.78)_42%,rgba(255,255,255,0.94)_100%)] p-5 shadow-[0_18px_46px_rgba(15,118,110,0.14),inset_0_1px_0_rgba(255,255,255,0.78)] transition-colors duration-300 sm:p-6 dark:border-teal-200/20 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.96)_48%,rgba(20,83,78,0.42)_100%)] dark:shadow-[0_18px_46px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(94,234,212,0.10)]"
      id="recommendations-card"
    >
      {/* Top glow line */}
      <div
        className="absolute inset-x-6 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(20,184,166,0.44), transparent)",
        }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(110,231,216,0.14)",
              color: "#6EE7D8",
              border: "1px solid rgba(110,231,216,0.22)",
            }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "var(--dash-teal-strong)" }}
            >
              AI Recommendations
            </p>
            <h2
              className="text-lg sm:text-xl font-bold"
              style={{ color: "var(--ui-heading)" }}
            >
              Smart Study Actions
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {formattedTime && (
            <span
              className="text-[10px] font-medium"
              style={{ color: "var(--ui-muted)" }}
            >
              Updated {formattedTime}
            </span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 self-start sm:self-auto"
            style={{
              background: !loading
                ? "linear-gradient(135deg,#6EE7D8,#14B8A6)"
                : "rgba(255,255,255,0.06)",
              color: !loading ? "#111827" : "var(--ui-subtle)",
              boxShadow: !loading
                ? "0 3px 10px rgba(110,231,216,0.22)"
                : "none",
              cursor: !loading ? "pointer" : "not-allowed",
            }}
            onMouseEnter={!loading ? handleRefreshEnter : undefined}
            onMouseLeave={!loading ? handleRefreshLeave : undefined}
          >
            {loading ? (
              <>
                <span className="w-3 h-3 border-2 border-teal-800 border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && recommendations.length === 0 ? (
        <RecommendationSkeleton />
      ) : error ? (
        <div
          className="rounded-xl p-3.5 text-sm"
          style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.18)",
            color: "var(--dash-danger)",
          }}
        >
          {error}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <RecommendationItem key={`${rec.type}-${i}`} rec={rec} index={i} />
          ))}
        </div>
      ) : rawInsight ? (
        <div
          className="rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed"
          style={{
            background: "rgba(110,231,216,0.04)",
            border: "1px solid rgba(110,231,216,0.11)",
            color: "var(--ui-text)",
          }}
        >
          {rawInsight}
        </div>
      ) : (
        <div
          className="flex min-h-[100px] items-center justify-center rounded-xl px-4 text-center"
          style={{
            background: "var(--dash-empty-bg)",
            border: "1px dashed var(--dash-empty-border)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--ui-muted)" }}>
            No recommendations yet. Add some tasks, log your mood, or use the
            doubt solver to get personalized suggestions.
          </p>
        </div>
      )}
    </section>
  );
});

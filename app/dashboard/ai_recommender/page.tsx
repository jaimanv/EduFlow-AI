"use client";

import { useState } from "react";

interface StudyTask {
  subject: string;
  deadline: string;
  priority: "low" | "medium" | "high";
}

interface TimetableSlot {
  time: string;
  subject: string;
  recommendation: string;
}

interface DaySchedule {
  date: string;
  slots: TimetableSlot[];
}

export default function StudyPlannerPage() {
  // ── Form fields (for Add Task only) ──────────────────────────────────────────
  const [subject, setSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  // ── Saved tasks (drives Generate button) ─────────────────────────────────────
  const [tasks, setTasks] = useState<StudyTask[]>([]);

  const [weakSubjects, setWeakSubjects] = useState("");
  const [syllabusText, setSyllabusText] = useState("");

  const [summary, setSummary] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [timetable, setTimetable] = useState<DaySchedule[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // "Add Task" only cares about the current form fields
  const canAddTask = subject.trim().length > 0 && deadline.length > 0;
  // "Generate" only cares about whether tasks have been saved + not loading
  const canGenerate = tasks.length > 0 && !loading;

  // ── Add task: saves to list, then clears the form ─────────────────────────────
  function addTask() {
    if (!canAddTask) return;
    setTasks((prev) => [
      ...prev,
      { subject: subject.trim(), deadline, priority },
    ]);
    // Clear form fields immediately after adding — this also disables "Add Task"
    // button again until the user fills in new values, making the two buttons
    // visually independent at all times.
    setSubject("");
    setDeadline("");
    setPriority("medium");
  }

  function removeTask(index: number) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  async function generatePlan() {
    if (!canGenerate) return;
    try {
      setLoading(true);
      setError("");
      setSummary("");
      setRecommendations([]);
      setTimetable([]);

      const formData = new FormData();
      formData.append("tasks", JSON.stringify(tasks));
      formData.append("weakSubjects", weakSubjects);
      formData.append("syllabusText", syllabusText);

      const response = await fetch("/api/study-recommender/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to generate study plan.");

      setSummary(data.summary);
      setRecommendations(data.recommendations ?? []);
      setTimetable(data.timetable ?? []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate study plan.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "var(--ui-surface)",
    border: "1px solid var(--ui-border)",
    color: "var(--ui-text)",
  };
  const cardStyle = {
    background: "var(--ui-surface)",
    border: "1px solid var(--ui-border)",
  };
  const inputCls =
    "w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors duration-150";

  return (
    <div className="min-h-screen px-6 py-10" style={{ background: "var(--ui-bg)" }}>
      <div className="mx-auto max-w-7xl">

        <div className="mb-10">
          <h1 className="text-3xl font-bold" style={{ color: "var(--ui-heading)" }}>
            AI Study Planner
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--ui-muted)" }}>
            Add your tasks, then generate a personalized AI study plan.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">

          {/* ── LEFT ─────────────────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* STEP 1 — Add task form */}
            <div className="rounded-2xl p-6 shadow-sm" style={cardStyle}>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{ background: "#14B8A6", color: "#0d2420" }}
                >
                  1
                </span>
                <h2 className="text-lg font-semibold" style={{ color: "var(--ui-heading)" }}>
                  Add Study Task
                </h2>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Subject (e.g. Data Structures)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  className={inputCls}
                  style={inputStyle}
                />
                <input
                  type="date"
                  value={deadline}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as "low" | "medium" | "high")
                  }
                  className={inputCls}
                  style={inputStyle}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>

                <button
                  type="button"
                  onClick={addTask}
                  disabled={!canAddTask}
                  className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-150"
                  style={{
                    background: canAddTask ? "#14B8A6" : "var(--ui-surface-2)",
                    color: canAddTask ? "#fff" : "var(--ui-muted)",
                    cursor: canAddTask ? "pointer" : "not-allowed",
                    opacity: canAddTask ? 1 : 0.5,
                    border: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (canAddTask)
                      (e.currentTarget as HTMLElement).style.background = "#0d9488";
                  }}
                  onMouseLeave={(e) => {
                    if (canAddTask)
                      (e.currentTarget as HTMLElement).style.background = "#14B8A6";
                  }}
                >
                  + Add Task
                </button>
              </div>
            </div>

            {/* STEP 2 — Tasks list */}
            <div className="rounded-2xl p-6" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{ background: "#14B8A6", color: "#0d2420" }}
                  >
                    2
                  </span>
                  <h2 className="text-lg font-semibold" style={{ color: "var(--ui-heading)" }}>
                    Added Tasks
                  </h2>
                </div>
                {tasks.length > 0 && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(110,231,216,0.12)", color: "#6EE7D8" }}
                  >
                    {tasks.length} task{tasks.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {tasks.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--ui-muted)" }}>
                  No tasks yet. Fill in Step 1 and click "Add Task".
                </p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between rounded-lg p-3"
                      style={{
                        background: "var(--ui-surface-2)",
                        border: "1px solid var(--ui-border)",
                      }}
                    >
                      <div>
                        <div className="text-sm font-medium" style={{ color: "var(--ui-heading)" }}>
                          {task.subject}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--ui-muted)" }}>
                          Deadline: {task.deadline} · Priority:{" "}
                          <span
                            style={{
                              color:
                                task.priority === "high"
                                  ? "#f87171"
                                  : task.priority === "medium"
                                  ? "#fbbf24"
                                  : "#6EE7D8",
                            }}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTask(index)}
                        className="ml-3 text-sm leading-none transition-colors duration-150 flex-shrink-0 mt-0.5"
                        style={{ color: "var(--ui-muted)" }}
                        aria-label={`Remove ${task.subject}`}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.color = "#ef4444")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.color = "var(--ui-muted)")
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STEP 3 — Weak subjects */}
            <div className="rounded-2xl p-6" style={cardStyle}>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{ background: "#14B8A6", color: "#0d2420" }}
                >
                  3
                </span>
                <h2 className="text-lg font-semibold" style={{ color: "var(--ui-heading)" }}>
                  Weak Subjects{" "}
                  <span className="text-xs font-normal" style={{ color: "var(--ui-muted)" }}>
                    (optional)
                  </span>
                </h2>
              </div>
              <textarea
                placeholder="e.g. Algorithms, DBMS, Operating Systems..."
                value={weakSubjects}
                onChange={(e) => setWeakSubjects(e.target.value)}
                rows={3}
                className={`${inputCls} resize-none`}
                style={inputStyle}
              />
            </div>

            {/* STEP 4 — Syllabus text */}
            <div className="rounded-2xl p-6" style={cardStyle}>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{ background: "#14B8A6", color: "#0d2420" }}
                >
                  4
                </span>
                <h2 className="text-lg font-semibold" style={{ color: "var(--ui-heading)" }}>
                  Syllabus{" "}
                  <span className="text-xs font-normal" style={{ color: "var(--ui-muted)" }}>
                    (optional)
                  </span>
                </h2>
              </div>
              <textarea
                placeholder="Paste your syllabus or topic list here…&#10;e.g. Unit 1: Arrays, Linked Lists&#10;Unit 2: Trees, Graphs"
                value={syllabusText}
                onChange={(e) => setSyllabusText(e.target.value)}
                rows={6}
                className={`${inputCls} resize-y`}
                style={inputStyle}
              />
            </div>
            {/* STEP 5 — Generate (only active after tasks are added) */}
            <button
              type="button"
              onClick={generatePlan}
              disabled={!canGenerate}
              className="w-full rounded-xl px-6 py-4 text-base font-semibold transition-all duration-200"
              style={{
                background: canGenerate
                  ? "linear-gradient(135deg, #14B8A6 0%, #6EE7D8 100%)"
                  : "var(--ui-surface-2)",
                color: canGenerate ? "#0d2420" : "var(--ui-muted)",
                cursor: canGenerate ? "pointer" : "not-allowed",
                opacity: canGenerate ? 1 : 0.5,
                boxShadow: canGenerate ? "0 0 24px rgba(110,231,216,0.25)" : "none",
                border: "none",
              }}
              onMouseEnter={(e) => {
                if (canGenerate) {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 32px rgba(110,231,216,0.45)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (canGenerate) {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 0 24px rgba(110,231,216,0.25)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Generating…
                </span>
              ) : (
                <>
                  {canGenerate
                    ? `Generate AI Study Plan (${tasks.length} task${tasks.length > 1 ? "s" : ""})`
                    : "Add tasks above to generate a plan"}
                </>
              )}
            </button>

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#f87171",
                }}
              >
                ⚠ {error}
              </div>
            )}
          </div>

          {/* ── RIGHT: Results ────────────────────────────────────────────────── */}
          <div className="space-y-6">

            <div className="rounded-2xl p-6" style={cardStyle}>
              <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--ui-heading)" }}>
                AI Summary
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ui-muted)" }}>
                {summary || "Your summary will appear here after generating a plan."}
              </p>
            </div>

            <div className="rounded-2xl p-6" style={cardStyle}>
              <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--ui-heading)" }}>
                Recommendations
              </h2>
              {recommendations.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--ui-muted)" }}>
                  Recommendations will appear here.
                </p>
              ) : (
                <ul className="space-y-2">
                  {recommendations.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm"
                      style={{
                        background: "var(--ui-surface-2)",
                        border: "1px solid var(--ui-border)",
                        color: "var(--ui-text)",
                      }}
                    >
                      <span style={{ color: "#6EE7D8", marginTop: "2px", flexShrink: 0 }}>✦</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl p-6" style={cardStyle}>
              <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--ui-heading)" }}>
                Generated Timetable
              </h2>

              {timetable.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--ui-muted)" }}>
                  Your timetable will appear here.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--ui-border)" }}>
                        {["Date", "Time", "Subject", "Recommendation"].map((h) => (
                          <th
                            key={h}
                            className="py-2.5 pr-4 text-left text-xs font-semibold uppercase tracking-wide"
                            style={{ color: "var(--ui-muted)" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timetable.map((day) =>
                        day.slots.map((slot, slotIdx) => (
                          <tr
                            key={`${day.date}-${slotIdx}`}
                            style={{ borderBottom: "0.5px solid var(--ui-border)" }}
                          >
                            {slotIdx === 0 ? (
                              <td
                                rowSpan={day.slots.length}
                                className="py-3 pr-4 align-top text-xs font-semibold whitespace-nowrap"
                                style={{ color: "#6EE7D8" }}
                              >
                                {formatDate(day.date)}
                              </td>
                            ) : null}
                            <td
                              className="py-3 pr-4 whitespace-nowrap font-mono text-xs"
                              style={{ color: "var(--ui-muted)" }}
                            >
                              {slot.time}
                            </td>
                            <td
                              className="py-3 pr-4 font-medium text-sm"
                              style={{ color: "var(--ui-heading)" }}
                            >
                              {slot.subject}
                            </td>
                            <td className="py-3 text-sm" style={{ color: "var(--ui-muted)" }}>
                              {slot.recommendation}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

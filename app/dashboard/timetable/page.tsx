"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../../lib/supabase";

type ColorTheme = "teal" | "purple" | "indigo" | "amber" | "rose" | "emerald";

interface TimetableSlot {
  id: string;
  subject: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  location: string | null;
  teacher: string | null;
  color: ColorTheme;
  user_id?: string;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const THEME_COLORS: Record<ColorTheme, { border: string; bg: string; text: string; dot: string }> = {
  teal: {
    border: "rgba(110,231,216,0.3)",
    bg: "rgba(110,231,216,0.08)",
    text: "#6EE7D8",
    dot: "#14B8A6",
  },
  purple: {
    border: "rgba(139,92,246,0.3)",
    bg: "rgba(139,92,246,0.08)",
    text: "#a78bfa",
    dot: "#8b5cf6",
  },
  indigo: {
    border: "rgba(99,102,241,0.3)",
    bg: "rgba(99,102,241,0.08)",
    text: "#818cf8",
    dot: "#6366f1",
  },
  amber: {
    border: "rgba(245,158,11,0.3)",
    bg: "rgba(245,158,11,0.08)",
    text: "#fbbf24",
    dot: "#f59e0b",
  },
  rose: {
    border: "rgba(244,63,94,0.3)",
    bg: "rgba(244,63,94,0.08)",
    text: "#fb7185",
    dot: "#f43f5e",
  },
  emerald: {
    border: "rgba(16,185,129,0.3)",
    bg: "rgba(16,185,129,0.08)",
    text: "#34d399",
    dot: "#10b981",
  },
};

const HOUR_START = 1; // 1:00 AM
const HOUR_END = 24;   // 12:00 AM
const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60;

function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatTimeLabel(hour: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${ampm}`;
}

function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  return `${displayHour}:${mStr} ${ampm}`;
}

function checkIsTableMissing(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || "");
  const message = String(err.message || "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST204" ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("not found")
  );
}

export default function TimetablePage() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocalOnly, setIsLocalOnly] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedListDay, setSelectedListDay] = useState<typeof DAYS_OF_WEEK[number]>("Monday");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [formSubject, setFormSubject] = useState("");
  const [formDay, setFormDay] = useState<typeof DAYS_OF_WEEK[number]>("Monday");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formLocation, setFormLocation] = useState("");
  const [formTeacher, setFormTeacher] = useState("");
  const [formColor, setFormColor] = useState<ColorTheme>("teal");
  const [formError, setFormError] = useState<string | null>(null);

  // AI Parser state
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState<Partial<TimetableSlot>[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Load slots
  const loadSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: uData } = await supabase.auth.getUser();
      const user = uData.user;
      if (user) {
        setUserId(user.id);
        const { data, error: fetchErr } = await supabase
          .from("timetable_slots")
          .select("*")
          .order("start_time", { ascending: true });

        if (fetchErr) {
          // If the table doesn't exist yet, fallback to localStorage
          if (checkIsTableMissing(fetchErr)) {
            setIsLocalOnly(true);
            const localData = localStorage.getItem(`timetable_slots_${user.id}`);
            if (localData) {
              setSlots(JSON.parse(localData));
            }
          } else {
            setError(fetchErr.message);
          }
        } else {
          setSlots(data || []);
          setIsLocalOnly(false);
        }
      } else {
        setError("User session not found.");
      }
    } catch (err) {
      console.error("Error loading timetable slots:", err);
      setIsLocalOnly(true);
      // Try local storage fallback anyway
      const localData = localStorage.getItem("timetable_slots_fallback");
      if (localData) {
        setSlots(JSON.parse(localData));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  // Save changes helper (handles database or local fallback)
  const saveSlotsList = async (updatedSlots: TimetableSlot[]) => {
    setSlots(updatedSlots);
    const storageKey = userId ? `timetable_slots_${userId}` : "timetable_slots_fallback";
    localStorage.setItem(storageKey, JSON.stringify(updatedSlots));

    if (!isLocalOnly && userId) {
      // Data is already synced or sync can be attempted.
      // In a real-time update model, we update db in action handlers.
    }
  };

  // Sync Local Storage to Supabase
  const syncToDatabase = async () => {
    if (!userId) return;
    setError(null);
    try {
      const storageKey = `timetable_slots_${userId}`;
      const localData = localStorage.getItem(storageKey);
      if (!localData) return;
      const localSlots = JSON.parse(localData) as TimetableSlot[];

      if (localSlots.length === 0) {
        setIsLocalOnly(false);
        return;
      }

      // Prepare slots for database (removing temp/local ids if needed, or keeping them)
      const dbPayload = localSlots.map(s => ({
        user_id: userId,
        subject: s.subject,
        day: s.day,
        start_time: s.start_time,
        end_time: s.end_time,
        location: s.location || null,
        teacher: s.teacher || null,
        color: s.color,
      }));

      // Delete existing in db and insert all
      const { error: delErr } = await supabase
        .from("timetable_slots")
        .delete()
        .eq("user_id", userId);

      if (delErr) {
        throw new Error(delErr.message);
      }

      const { error: insErr } = await supabase
        .from("timetable_slots")
        .insert(dbPayload);

      if (insErr) {
        if (checkIsTableMissing(insErr)) {
          throw new Error("Table timetable_slots does not exist in database yet. Please run migration.");
        }
        throw new Error(insErr.message);
      }

      setIsLocalOnly(false);
      await loadSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed.");
    }
  };

  // Open modal for new slot
  const handleAddClick = () => {
    setEditingSlot(null);
    setFormSubject("");
    setFormDay("Monday");
    setFormStartTime("09:00");
    setFormEndTime("10:00");
    setFormLocation("");
    setFormTeacher("");
    setFormColor("teal");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing slot
  const handleEditClick = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setFormSubject(slot.subject);
    setFormDay(slot.day);
    setFormStartTime(slot.start_time);
    setFormEndTime(slot.end_time);
    setFormLocation(slot.location || "");
    setFormTeacher(slot.teacher || "");
    setFormColor(slot.color);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formSubject.trim()) {
      setFormError("Subject is required.");
      return;
    }

    const startMin = toMinutes(formStartTime);
    const endMin = toMinutes(formEndTime);

    if (endMin <= startMin) {
      setFormError("End time must be after start time.");
      return;
    }

    const payload: Omit<TimetableSlot, "id"> = {
      subject: formSubject.trim(),
      day: formDay,
      start_time: formStartTime,
      end_time: formEndTime,
      location: formLocation.trim() || null,
      teacher: formTeacher.trim() || null,
      color: formColor,
    };

    try {
      if (editingSlot) {
        // Update slot
        if (isLocalOnly) {
          const updated = slots.map(s => s.id === editingSlot.id ? { ...s, ...payload } : s);
          await saveSlotsList(updated);
        } else {
          const { error: upErr } = await supabase
            .from("timetable_slots")
            .update(payload)
            .eq("id", editingSlot.id);

          if (upErr) {
            if (checkIsTableMissing(upErr)) {
              setIsLocalOnly(true);
              const updated = slots.map(s => s.id === editingSlot.id ? { ...s, ...payload } : s);
              await saveSlotsList(updated);
            } else {
              throw new Error(upErr.message);
            }
          } else {
            await loadSlots();
          }
        }
      } else {
        // Create slot
        if (isLocalOnly) {
          const newSlot: TimetableSlot = {
            id: crypto.randomUUID(),
            ...payload,
          };
          await saveSlotsList([...slots, newSlot]);
        } else {
          const { error: insErr } = await supabase
            .from("timetable_slots")
            .insert({
              ...payload,
              user_id: userId,
            });

          if (insErr) {
            if (checkIsTableMissing(insErr)) {
              setIsLocalOnly(true);
              const newSlot: TimetableSlot = {
                id: crypto.randomUUID(),
                ...payload,
              };
              await saveSlotsList([...slots, newSlot]);
            } else {
              throw new Error(insErr.message);
            }
          } else {
            await loadSlots();
          }
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : (err as any)?.message || "Failed to save slot.";
      setFormError(msg);
    }
  };

  // Delete slot
  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;
    try {
      if (isLocalOnly) {
        const updated = slots.filter(s => s.id !== id);
        await saveSlotsList(updated);
      } else {
        const { error: delErr } = await supabase
          .from("timetable_slots")
          .delete()
          .eq("id", id);
        if (delErr) {
          if (checkIsTableMissing(delErr)) {
            setIsLocalOnly(true);
            const updated = slots.filter(s => s.id !== id);
            await saveSlotsList(updated);
          } else {
            throw new Error(delErr.message);
          }
        } else {
          await loadSlots();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err as any)?.message || "Failed to delete slot.";
      alert(msg);
    }
  };

  // AI Parse handler
  const handleAiParse = async () => {
    setAiError(null);
    setAiPreview(null);
    if (!aiText.trim()) return;

    setAiLoading(true);
    try {
      const response = await fetch("/api/doubt-solver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType: "timetable",
          userMessage: aiText.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "AI failed to parse timetable slots.");
      }

      // Try to parse clean JSON array from answer
      let jsonText = data.answer.trim();
      
      // Extract content between the first '[' and last ']'
      const firstBracket = jsonText.indexOf("[");
      const lastBracket = jsonText.lastIndexOf("]");
      const firstBrace = jsonText.indexOf("{");
      const lastBrace = jsonText.lastIndexOf("}");

      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        jsonText = jsonText.substring(firstBracket, lastBracket + 1);
      } else if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = "[" + jsonText.substring(firstBrace, lastBrace + 1) + "]";
      } else if (jsonText.includes("```")) {
        const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonText = match[1].trim();
        }
      }

      // Sanitize raw newlines and tabs inside string values in the JSON block
      let sanitizedJson = "";
      let inString = false;
      let escaped = false;
      for (let i = 0; i < jsonText.length; i++) {
        const char = jsonText[i];
        if (char === '"' && !escaped) {
          inString = !inString;
          sanitizedJson += char;
        } else if (char === '\\' && inString) {
          escaped = !escaped;
          sanitizedJson += char;
        } else {
          if (inString) {
            if (char === '\n') {
              sanitizedJson += '\\n';
            } else if (char === '\r') {
              sanitizedJson += '\\r';
            } else if (char === '\t') {
              sanitizedJson += '\\t';
            } else {
              sanitizedJson += char;
            }
          } else {
            sanitizedJson += char;
          }
          escaped = false;
        }
      }

      const parsedArray = JSON.parse(sanitizedJson);
      if (!Array.isArray(parsedArray)) {
        throw new Error("AI did not return a valid list of classes. Please rephrase.");
      }

      // Basic structure validation
      const verified = parsedArray.map((item: any, idx: number) => {
        let day: typeof DAYS_OF_WEEK[number] = "Monday";
        if (item.day && DAYS_OF_WEEK.includes(item.day)) {
          day = item.day;
        }

        let color: ColorTheme = "teal";
        if (item.color && ["teal", "purple", "indigo", "amber", "rose", "emerald"].includes(item.color)) {
          color = item.color;
        }

        return {
          id: `ai-temp-${idx}`,
          subject: String(item.subject || "Study Session"),
          day,
          start_time: String(item.start_time || "09:00"),
          end_time: String(item.end_time || "10:00"),
          location: item.location ? String(item.location) : null,
          teacher: item.teacher ? String(item.teacher) : null,
          color,
        };
      });

      setAiPreview(verified);
    } catch (err) {
      console.warn("AI Timetable Parse Warning:", err);
      setAiError(err instanceof Error ? err.message : "AI could not parse schedule. Try giving simpler details.");
    } finally {
      setAiLoading(false);
    }
  };

  // Import parsed AI slots
  const handleImportAiSlots = async () => {
    if (!aiPreview || aiPreview.length === 0) return;

    try {
      const formatted = aiPreview.map(p => ({
        id: crypto.randomUUID(),
        subject: p.subject!,
        day: p.day!,
        start_time: p.start_time!,
        end_time: p.end_time!,
        location: p.location || null,
        teacher: p.teacher || null,
        color: p.color!,
      }));

      if (isLocalOnly) {
        await saveSlotsList([...slots, ...formatted]);
      } else {
        const payload = formatted.map(s => ({
          user_id: userId,
          subject: s.subject,
          day: s.day,
          start_time: s.start_time,
          end_time: s.end_time,
          location: s.location,
          teacher: s.teacher,
          color: s.color,
        }));

        const { error: insErr } = await supabase
          .from("timetable_slots")
          .insert(payload);

        if (insErr) throw insErr;
        await loadSlots();
      }

      setAiPreview(null);
      setAiText("");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to import slots.");
    }
  };

  // Filter slots for a day
  const getSlotsForDay = (day: string) => {
    return slots
      .filter(s => s.day === day)
      .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
  };

  // Generate hourly rows for grid
  const hoursRange = useMemo(() => {
    const list = [];
    for (let h = HOUR_START; h <= HOUR_END; h++) {
      list.push(h);
    }
    return list;
  }, []);

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-3"
            style={{
              background: "rgba(110,231,216,0.08)",
              color: "#6EE7D8",
              border: "1px solid rgba(110,231,216,0.18)",
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Weekly Schedule
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--ui-heading)" }}>
            Structured Class Timetable
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--ui-muted)" }}>
            Create your weekly class structure, allocate lectures, and track rooms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${viewMode === "grid" ? "bg-[rgba(110,231,216,0.12)] text-[#6EE7D8]" : "text-[var(--ui-muted)]"}`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${viewMode === "list" ? "bg-[rgba(110,231,216,0.12)] text-[#6EE7D8]" : "text-[var(--ui-muted)]"}`}
            >
              List View
            </button>
          </div>

          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: "linear-gradient(135deg,#6EE7D8,#14B8A6)",
              color: "#111827",
              boxShadow: "0 4px 16px rgba(110,231,216,0.28)",
              cursor: "pointer",
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
            </svg>
            Add Slot
          </button>
        </div>
      </div>

      {/* Sync / Warning Banners */}
      {isLocalOnly && (
        <div
          className="rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.22)",
          }}
        >
          <div className="flex gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="text-sm font-semibold text-[var(--ui-heading)]">Local Storage Mode Active</h4>
              <p className="text-xs text-[var(--ui-muted)] mt-0.5">
                The database table `timetable_slots` is not yet available in Supabase. Your changes are saved safely in your browser.
              </p>
            </div>
          </div>
          <button
            onClick={syncToDatabase}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: "rgba(245,158,11,0.15)",
              color: "#fbbf24",
              border: "1px solid rgba(245,158,11,0.25)",
            }}
          >
            Sync to Supabase
          </button>
        </div>
      )}

      {error && (
        <div
          className="rounded-2xl p-4 text-sm"
          style={{
            background: "rgba(244,63,94,0.08)",
            border: "1px solid rgba(244,63,94,0.22)",
            color: "#fb7185",
          }}
        >
          {error}
        </div>
      )}

      {/* Main Grid View */}
      {viewMode === "grid" && (
        <div
          className="rounded-2xl border border-[var(--ui-border)] overflow-x-auto shadow-xl"
          style={{ background: "var(--ui-surface)" }}
        >
          <div className="min-w-[850px] relative">
            {/* Header Columns */}
            <div className="grid grid-cols-8 border-b border-[var(--ui-border)] text-center font-semibold text-xs py-3" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="border-r border-[var(--ui-border)] text-[var(--ui-muted)] flex items-center justify-center">Time</div>
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="text-[var(--ui-heading)] uppercase tracking-wider py-1 font-bold">
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>

            {/* Time Grid Layout */}
            <div className="relative grid grid-cols-8" style={{ height: "650px" }}>
              {/* Vertical Time Rows Grid Lines */}
              <div className="col-span-1 border-r border-[var(--ui-border)] relative flex flex-col justify-between text-[10px] text-[var(--ui-muted)] pr-3 py-1 font-mono text-right select-none">
                {hoursRange.map((hour, idx) => (
                  <div key={hour} style={{ height: "50px", position: "relative" }}>
                    <span className="absolute right-2 -top-2">{formatTimeLabel(hour)}</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {DAYS_OF_WEEK.map((day) => {
                const daySlots = getSlotsForDay(day);
                return (
                  <div key={day} className="col-span-1 border-r border-[var(--ui-border)] last:border-r-0 relative h-full">
                    {/* Hourly division guides */}
                    {hoursRange.slice(0, -1).map((h) => (
                      <div
                        key={h}
                        className="border-b border-[var(--ui-border)]/20 absolute w-full"
                        style={{
                          top: `${((h - HOUR_START) * 60 / TOTAL_MINUTES) * 100}%`,
                          height: `${(60 / TOTAL_MINUTES) * 100}%`,
                        }}
                      />
                    ))}

                    {/* Absolute slots placing */}
                    {daySlots.map((slot) => {
                      const startM = toMinutes(slot.start_time);
                      const endM = toMinutes(slot.end_time);

                      // Normalize minutes within boundaries
                      const startOffset = Math.max(HOUR_START * 60, startM);
                      const endOffset = Math.min(HOUR_END * 60, endM);

                      if (endOffset <= startOffset) return null;

                      const topPct = ((startOffset - HOUR_START * 60) / TOTAL_MINUTES) * 100;
                      const heightPct = ((endOffset - startOffset) / TOTAL_MINUTES) * 100;

                      const theme = THEME_COLORS[slot.color] || THEME_COLORS.teal;

                      return (
                        <div
                          key={slot.id}
                          onClick={() => handleEditClick(slot)}
                          className="absolute w-[calc(100%-8px)] left-1 p-2 rounded-xl border transition-all duration-150 hover:shadow-lg hover:scale-[1.01] cursor-pointer flex flex-col justify-between overflow-hidden"
                          style={{
                            top: `${topPct}%`,
                            height: `calc(${heightPct}% - 4px)`,
                            background: theme.bg,
                            borderColor: theme.border,
                          }}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: theme.dot }} />
                              <h4 className="text-[11px] font-bold truncate" style={{ color: "var(--ui-heading)" }}>
                                {slot.subject}
                              </h4>
                            </div>
                            <p className="text-[9px] mt-0.5" style={{ color: "var(--ui-muted)" }}>
                              {formatTime12h(slot.start_time)} - {formatTime12h(slot.end_time)}
                            </p>
                          </div>

                          <div className="mt-1">
                            {slot.location && (
                              <div className="flex items-center gap-1 text-[8px]" style={{ color: "var(--ui-muted)" }}>
                                <span>📍</span>
                                <span className="truncate">{slot.location}</span>
                              </div>
                            )}
                            {slot.teacher && (
                              <div className="flex items-center gap-1 text-[8px]" style={{ color: "var(--ui-muted)" }}>
                                <span>👤</span>
                                <span className="truncate">{slot.teacher}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* List / Mobile View */}
      {viewMode === "list" && (
        <div className="grid md:grid-cols-4 gap-6">
          {/* Day list selector */}
          <div className="md:col-span-1 flex md:flex-col overflow-x-auto md:overflow-x-visible gap-2 bg-[var(--ui-surface)] border border-[var(--ui-border)] p-3 rounded-2xl">
            {DAYS_OF_WEEK.map((day) => {
              const count = getSlotsForDay(day).length;
              const isSelected = selectedListDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedListDay(day)}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 flex-shrink-0 md:flex-shrink ${isSelected ? "bg-[rgba(110,231,216,0.12)] text-[#6EE7D8] border border-[rgba(110,231,216,0.2)]" : "text-[var(--ui-muted)] border border-transparent"}`}
                >
                  <span>{day}</span>
                  {count > 0 && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{
                        background: isSelected ? "rgba(110,231,216,0.2)" : "rgba(255,255,255,0.06)",
                        color: isSelected ? "#6EE7D8" : "var(--ui-muted)",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Cards list for selected day */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: "var(--ui-heading)" }}>
              <span>📅</span> {selectedListDay} Classes
            </h3>

            {getSlotsForDay(selectedListDay).length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center border border-dashed border-[var(--ui-border)]"
                style={{ background: "rgba(110,231,216,0.02)" }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--ui-muted)" }}>
                  No classes scheduled for {selectedListDay}.
                </p>
                <button
                  onClick={handleAddClick}
                  className="mt-4 text-xs font-semibold px-4 py-2 rounded-xl text-[#111827]"
                  style={{ background: "linear-gradient(135deg,#6EE7D8,#14B8A6)" }}
                >
                  Schedule class
                </button>
              </div>
            ) : (
              getSlotsForDay(selectedListDay).map((slot) => {
                const theme = THEME_COLORS[slot.color] || THEME_COLORS.teal;
                return (
                  <div
                    key={slot.id}
                    onClick={() => handleEditClick(slot)}
                    className="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-150 hover:border-[rgba(110,231,216,0.3)] hover:bg-[rgba(255,255,255,0.01)] cursor-pointer"
                    style={{
                      background: "var(--ui-surface)",
                      border: "1px solid var(--ui-border)",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                      style={{
                        background: theme.bg,
                        border: `1px solid ${theme.border}`,
                        color: theme.text,
                      }}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-tight">Time</span>
                      <span className="text-[11px] font-bold mt-0.5">{slot.start_time}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: theme.dot }} />
                        <h4 className="text-base font-semibold truncate" style={{ color: "var(--ui-heading)" }}>
                          {slot.subject}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1" style={{ color: "var(--ui-muted)" }}>
                        <span>⏰ {formatTime12h(slot.start_time)} - {formatTime12h(slot.end_time)}</span>
                        {slot.location && <span>📍 {slot.location}</span>}
                        {slot.teacher && <span>👤 {slot.teacher}</span>}
                      </div>
                    </div>

                    <span
                      className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{
                        background: theme.bg,
                        color: theme.text,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      {slot.color}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* AI Schedule Parser Panel */}
      <div
        className="rounded-2xl p-6 transition-all duration-200 border border-[var(--ui-border)] space-y-4"
        style={{ background: "var(--ui-surface)" }}
      >
        <div>
          <h3 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--ui-heading)" }}>
            ✨ AI Timetable Import
          </h3>
          <p className="text-xs text-[var(--ui-muted)] mt-1">
            Don&apos;t want to enter classes one by one? Paste your schedule below and let EduFlow AI automatically populate your week!
          </p>
        </div>

        <div className="space-y-3">
          <textarea
            value={aiText}
            onChange={(e) => {
              setAiText(e.target.value);
              if (aiError) setAiError(null);
            }}
            placeholder="e.g. My schedule is: Monday & Wednesday: Math from 09:00 to 10:30 with Prof. Miller in Hall C. Tuesday & Thursday: Chemistry from 14:00 to 15:30."
            className="w-full h-24 text-sm"
            style={{
              background: "var(--ui-surface)",
              border: "1px solid var(--ui-border)",
              color: "var(--ui-heading)",
              outline: "none",
              borderRadius: "0.75rem",
              padding: "0.625rem 0.875rem",
              resize: "none",
            }}
            disabled={aiLoading}
          />

          {aiError && (
            <div
              className="rounded-xl p-3 text-xs"
              style={{
                background: "rgba(244,63,94,0.1)",
                border: "1px solid rgba(244,63,94,0.22)",
                color: "#fb7185",
              }}
            >
              {aiError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleAiParse}
              disabled={aiLoading || !aiText.trim()}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: aiText.trim() && !aiLoading ? "linear-gradient(135deg,#6EE7D8,#14B8A6)" : "rgba(255,255,255,0.06)",
                color: aiText.trim() && !aiLoading ? "#111827" : "var(--ui-subtle)",
                cursor: aiText.trim() && !aiLoading ? "pointer" : "not-allowed",
              }}
            >
              {aiLoading ? "AI is parsing..." : "Parse Schedule"}
            </button>

            {aiPreview && (
              <button
                onClick={handleImportAiSlots}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#111827] cursor-pointer"
                style={{ background: "#6EE7D8" }}
              >
                Import Parsed Slots ({aiPreview.length})
              </button>
            )}
          </div>

          {/* AI Previews */}
          {aiPreview && (
            <div className="rounded-xl p-4 border border-[var(--ui-border)] space-y-3" style={{ background: "rgba(110,231,216,0.03)" }}>
              <p className="text-xs font-semibold text-[#6EE7D8] uppercase tracking-wide">AI Parsed Preview</p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {aiPreview.map((item, idx) => {
                  const theme = THEME_COLORS[item.color || "teal"];
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border text-xs"
                      style={{
                        background: "var(--ui-surface)",
                        borderColor: theme.border,
                      }}
                    >
                      <p className="font-bold text-[var(--ui-heading)]">{item.subject}</p>
                      <p className="text-[var(--ui-muted)] mt-1">🗓️ {item.day}</p>
                      <p className="text-[var(--ui-muted)]">⏰ {item.start_time} - {item.end_time}</p>
                      {item.location && <p className="text-[var(--ui-muted)]">📍 {item.location}</p>}
                      {item.teacher && <p className="text-[var(--ui-muted)]">👤 {item.teacher}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--ui-border)] shadow-2xl overflow-hidden"
            style={{ background: "var(--ui-surface)" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--ui-border)]">
              <h3 className="text-lg font-bold" style={{ color: "var(--ui-heading)" }}>
                {editingSlot ? "Edit Timetable Slot" : "Add Timetable Slot"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--ui-muted)] hover:text-[var(--ui-heading)] text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div
                  className="rounded-xl p-3 text-xs"
                  style={{
                    background: "rgba(244,63,94,0.1)",
                    border: "1px solid rgba(244,63,94,0.22)",
                    color: "#fb7185",
                  }}
                >
                  {formError}
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--ui-heading)" }}>
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics II"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm border border-[var(--ui-border)]"
                  style={{ background: "var(--ui-surface)", color: "var(--ui-heading)", outline: "none" }}
                />
              </div>

              {/* Day of Week */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--ui-heading)" }}>
                  Day of the Week
                </label>
                <select
                  value={formDay}
                  onChange={(e) => setFormDay(e.target.value as any)}
                  className="w-full rounded-xl px-3 py-2 text-sm border border-[var(--ui-border)]"
                  style={{ background: "var(--ui-surface)", color: "var(--ui-heading)", outline: "none" }}
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--ui-heading)" }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm border border-[var(--ui-border)]"
                    style={{ background: "var(--ui-surface)", color: "var(--ui-heading)", outline: "none" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--ui-heading)" }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm border border-[var(--ui-border)]"
                    style={{ background: "var(--ui-surface)", color: "var(--ui-heading)", outline: "none" }}
                  />
                </div>
              </div>

              {/* Location & Teacher */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--ui-heading)" }}>
                    Location / Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 102"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm border border-[var(--ui-border)]"
                    style={{ background: "var(--ui-surface)", color: "var(--ui-heading)", outline: "none" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--ui-heading)" }}>
                    Teacher Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. Smith"
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm border border-[var(--ui-border)]"
                    style={{ background: "var(--ui-surface)", color: "var(--ui-heading)", outline: "none" }}
                  />
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--ui-heading)" }}>
                  Color Badge Theme
                </label>
                <div className="flex justify-between gap-2">
                  {(["teal", "purple", "indigo", "amber", "rose", "emerald"] as ColorTheme[]).map(c => {
                    const active = formColor === c;
                    const theme = THEME_COLORS[c];
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormColor(c)}
                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all"
                        style={{
                          background: theme.dot,
                          borderColor: active ? "var(--ui-heading)" : "transparent",
                          boxShadow: active ? `0 0 8px ${theme.dot}` : "none",
                        }}
                      >
                        {active && <span className="text-[10px] text-white">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-[var(--ui-border)]">
                {editingSlot && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(editingSlot.id)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition"
                  >
                    Delete Slot
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="ml-auto px-4 py-2.5 rounded-xl text-xs font-semibold border border-[var(--ui-border)] text-[var(--ui-muted)] hover:text-[var(--ui-heading)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#111827]"
                  style={{ background: "linear-gradient(135deg,#6EE7D8,#14B8A6)" }}
                >
                  {editingSlot ? "Save Changes" : "Add Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

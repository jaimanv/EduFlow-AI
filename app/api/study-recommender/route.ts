import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudyTask {
  subject: string;
  deadline: string;
  priority: "low" | "medium" | "high";
}

interface TimeSlot {
  time: string;
  subject: string;
  recommendation: string;
}

interface DaySchedule {
  date: string;
  slots: TimeSlot[];
}

interface StudyPlanResponse {
  summary: string;
  recommendations: string[];
  timetable: DaySchedule[];
}

// ─── Gemini client ─────────────────────────────────────────────────────────────

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const tasks: StudyTask[] = JSON.parse(
      String(formData.get("tasks") || "[]")
    );

    const weakSubjects = String(formData.get("weakSubjects") || "");
    const syllabusText = String(formData.get("syllabusText") || "");

    // ── Input validation ───────────────────────────────────────────────────────
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    if (tasks.length === 0) {
      return NextResponse.json(
        { error: "No tasks provided. Please add at least one task." },
        { status: 400 }
      );
    }

    // ── Build prompt ───────────────────────────────────────────────────────────
    const today = new Date().toISOString().split("T")[0];

    const prompt = `
You are EduFlow AI Study Planner.

Today's date: ${today}

Generate a personalized 7-day study plan for a student.

Rules:
- Prioritize subjects with the nearest deadlines.
- Give extra daily slots to subjects listed as weak.
- Schedule each slot as exactly 1 hour, starting from 09:00.
- Do NOT schedule more than the reasonable number of slots per day.
- Keep recommendations concise and actionable (max 12 words).
- Keep summary under 20 words.

Tasks:
${JSON.stringify(tasks, null, 2)}

Weak Subjects:
${weakSubjects || "None specified"}

Syllabus Content:
${syllabusText ? syllabusText.slice(0, 3000) : "Not provided"}

Return ONLY valid JSON — no markdown fences, no explanation — matching this exact shape:

{
  "summary": "string",
  "recommendations": ["string", "string", "string"],
  "timetable": [
    {
      "date": "YYYY-MM-DD",
      "slots": [
        {
          "time": "HH:MM – HH:MM",
          "subject": "string",
          "recommendation": "string"
        }
      ]
    }
  ]
}
`;

    // ── Call Gemini ────────────────────────────────────────────────────────────
    const result = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    // `result.text` is a getter in @google/genai ≥ 0.7 — call it as a property,
    // not a method. Older versions may use result.response.text().
    const rawText: string = result.text ?? "";

    if (!rawText) {
      throw new Error("Empty response from Gemini.");
    }

    // Strip markdown fences if the model ignores the instruction
    const cleaned = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const json: StudyPlanResponse = JSON.parse(cleaned);

    // ── Validate shape ─────────────────────────────────────────────────────────
    if (
      typeof json.summary !== "string" ||
      !Array.isArray(json.recommendations) ||
      !Array.isArray(json.timetable)
    ) {
      throw new Error("Unexpected JSON shape from Gemini.");
    }

    return NextResponse.json(json);
  } catch (error) {
    console.error("[study-plan] Error:", error);

    const message =
      error instanceof SyntaxError
        ? "AI returned an unexpected format. Please try again."
        : error instanceof Error
        ? error.message
        : "Failed to generate study plan.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
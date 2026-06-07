let logged = false;

export function checkEnvStatus() {
  const isDev = process.env.NODE_ENV === "development";
  
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const aiProvider = process.env.AI_PROVIDER || "gemini";
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const hasOpenAiKey = !!process.env.OPENAI_API_KEY;
  
  const hasResendKey = !!process.env.RESEND_API_KEY;
  
  const aiActive = hasGeminiKey || hasOpenAiKey;
  const emailActive = hasResendKey;

  if (isDev && !logged) {
    logged = true;
    console.log("\x1b[36m%s\x1b[0m", "=== EduFlow AI Feature Configuration Status ===");
    console.log(`Supabase (Core Database/Auth): ${hasSupabaseUrl && hasSupabaseKey ? "ACTIVE ✅" : "INACTIVE ❌ (Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)"}`);
    console.log(`AI Features (Doubt Solver / Notes Generator): ${aiActive ? "ACTIVE ✅" : "INACTIVE ❌ (Missing GEMINI_API_KEY)"}`);
    console.log(`Email Features (Contact Form): ${emailActive ? "ACTIVE ✅" : "INACTIVE ❌ (Missing RESEND_API_KEY)"}`);
    console.log("\x1b[36m%s\x1b[0m", "===============================================");
  }

  return {
    supabase: { active: hasSupabaseUrl && hasSupabaseKey },
    ai: { active: aiActive, message: aiActive ? "Active" : "AI features are disabled because the Gemini API key is missing." },
    email: { active: emailActive, message: emailActive ? "Active" : "Email submission is disabled because the Resend API key is missing." }
  };
}

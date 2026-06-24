// components/FloatingChatbot.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { FormattedNote } from "./notes/formatted-note";

type ChatSession = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type ChatMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export default function FloatingChatbot() {
  const [visible, setVisible] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (visible) {
      scrollToBottom();
    }
  }, [messages, sending, visible]);

  // Load chat sessions from Supabase
  const loadSessions = useCallback(async (autoSelect = true) => {
    try {
      setSetupRequired(false);
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      const { data, error: qErr } = await supabase
        .from("chat_sessions")
        .select("id, title, created_at, updated_at")
        .order("updated_at", { ascending: false });

      if (qErr) {
        if (qErr.code === "42P01") {
          setSetupRequired(true);
        }
        return;
      }

      setSessions(data || []);
      
      if (autoSelect && data && data.length > 0) {
        setActiveSessionId(data[0].id);
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
    }
  }, []);

  // Fetch sessions when widget becomes visible
  useEffect(() => {
    if (visible) {
      loadSessions(activeSessionId === null);
    }
  }, [visible, loadSessions]);

  // Fetch messages when active session changes
  useEffect(() => {
    if (!visible || !activeSessionId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const { data, error: qErr } = await supabase
          .from("chat_messages")
          .select("id, session_id, role, content, created_at")
          .eq("session_id", activeSessionId)
          .order("created_at", { ascending: true });

        if (qErr) {
          console.error(qErr.message);
          return;
        }

        setMessages(data || []);
      } catch (e) {
        console.error("Failed to load messages:", e);
      }
    };

    fetchMessages();
  }, [activeSessionId, visible]);

  // Start a new chat session
  const startNewChat = async () => {
    try {
      setError(null);
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      if (!user) return;

      const title = "Quick Chat";
      const { data, error: insErr } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          title,
        })
        .select()
        .single();

      if (insErr) {
        setError(insErr.message);
        return;
      }

      setSessions((prev) => [data, ...prev]);
      setActiveSessionId(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create new chat.");
    }
  };

  // Send message
  const sendMessage = async () => {
    const messageText = input.trim();
    if (!messageText) return;

    let currentSessionId = activeSessionId;

    // If no active session, create one first
    if (!currentSessionId) {
      try {
        setSending(true);
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;

        const firstWords = messageText.split(" ").slice(0, 4).join(" ");
        const title = firstWords.length > 20 ? firstWords.slice(0, 20) + "..." : firstWords || "Quick Chat";
        
        const { data, error: insErr } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: u.user.id,
            title,
          })
          .select()
          .single();

        if (insErr) {
          setError(insErr.message);
          setSending(false);
          return;
        }

        setSessions((prev) => [data, ...prev]);
        setActiveSessionId(data.id);
        currentSessionId = data.id;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to start chat.");
        setSending(false);
        return;
      }
    }

    setInput("");
    setSending(true);
    setError(null);

    if (!currentSessionId) {
      setSending(false);
      return;
    }

    // Optimistically update UI
    const optimisticUserMsg: ChatMessage = {
      id: Math.random().toString(),
      session_id: currentSessionId,
      role: "user",
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          userMessage: messageText,
        }),
      });

      const data = (await res.json()) as { answer?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error || "Failed to process chat response.");
      }

      if (data.answer) {
        const aiMsg: ChatMessage = {
          id: Math.random().toString(),
          session_id: currentSessionId,
          role: "assistant",
          content: data.answer,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);

        // Auto rename "Quick Chat" to match the query context
        const currentSession = sessions.find((s) => s.id === currentSessionId);
        if (currentSession && currentSession.title === "Quick Chat") {
          const firstWords = messageText.split(" ").slice(0, 4).join(" ");
          const cleanTitle = firstWords.length > 20 ? firstWords.slice(0, 20) + "..." : firstWords || "Quick Chat";
          
          await supabase
            .from("chat_sessions")
            .update({ title: cleanTitle })
            .eq("id", currentSessionId);

          setSessions((prev) =>
            prev.map((s) => (s.id === currentSessionId ? { ...s, title: cleanTitle } : s))
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI chatbot request failed.");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id));
    } finally {
      setSending(false);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => {
          setVisible((prev) => !prev);
        }}
        title="Quick AI Assistant"
        className="fixed bottom-6 right-28 z-[1000] flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-teal-400 to-cyan-500 text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-all duration-200 hover:scale-105 hover:shadow-[0_14px_35px_rgba(20,184,166,0.35)]"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Popup Dialog Window */}
      {visible && (
        <div 
          className="fixed bottom-24 right-6 md:right-28 z-[1000] w-[350px] md:w-[380px] h-[500px] max-h-[70vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
          style={{
            background: "var(--ui-surface)",
            borderColor: "var(--ui-border)"
          }}
        >
          {/* Header */}
          <header 
            className="p-4 border-b flex items-center justify-between flex-shrink-0"
            style={{
              borderBottomColor: "var(--ui-border)",
              background: "var(--ui-surface-2)"
            }}
          >
            <div className="min-w-0 flex-1">
              {sessions.length > 0 ? (
                <select
                  value={activeSessionId || ""}
                  onChange={(e) => setActiveSessionId(e.target.value || null)}
                  className="bg-transparent text-xs font-bold outline-none max-w-full cursor-pointer transition-colors"
                  style={{ color: "var(--ui-text)" }}
                >
                  {sessions.map((s) => (
                    <option 
                      key={s.id} 
                      value={s.id} 
                      className="bg-white dark:bg-[#1e293b] text-gray-900 dark:text-slate-100"
                    >
                      {s.title}
                    </option>
                  ))}
                </select>
              ) : (
                <h3 className="text-xs font-bold" style={{ color: "var(--ui-heading)" }}>AI Assistant</h3>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={startNewChat}
                title="New conversation"
                className="p-1 rounded text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={() => setVisible(false)}
                title="Close chat"
                className="p-1 rounded transition-colors"
                style={{ color: "var(--ui-muted)" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </header>

          {/* Setup required notification */}
          {setupRequired ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs" style={{ color: "var(--ui-text)" }}>
                Setup required: Run the SQL database script to enable the persistent chatbot.
              </p>
              <button
                onClick={() => loadSessions(true)}
                className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-xs font-semibold text-[#0d2420] transition-colors"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {/* Message scroll container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.length === 0 && !sending ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-10 opacity-70">
                    <svg className="w-8 h-8 text-teal-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-xs font-semibold" style={{ color: "var(--ui-heading)" }}>Hello! Ask me anything.</p>
                    <p className="text-[10px] max-w-[200px]" style={{ color: "var(--ui-muted)" }}>I can help write code, solve academic doubts, or draft notes.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <div key={msg.id} className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className="rounded-2xl px-3.5 py-2.5 max-w-[85%] text-xs shadow-sm border transition-colors duration-200"
                          style={{
                            background: isUser ? "rgba(20, 184, 166, 0.06)" : "var(--ui-surface)",
                            borderColor: isUser ? "rgba(20, 184, 166, 0.15)" : "var(--ui-border)",
                            color: "var(--ui-text)"
                          }}
                        >
                          <FormattedNote content={msg.content} emptyText="" />
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Sending state typing loader */}
                {sending && (
                  <div className="flex gap-2.5 justify-start">
                    <div 
                      className="rounded-2xl px-3.5 py-2.5 border flex items-center gap-1"
                      style={{
                        background: "var(--ui-surface)",
                        borderColor: "var(--ui-border)",
                      }}
                    >
                      <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Error block */}
              {error && (
                <div 
                  className="px-4 py-2 border-t text-[10px] flex items-start gap-1 flex-shrink-0"
                  style={{
                    background: "rgba(239, 68, 68, 0.05)",
                    borderTopColor: "rgba(239, 68, 68, 0.1)",
                    color: "rgba(239, 68, 68, 0.8)"
                  }}
                >
                  <svg className="w-3.5 h-3.5 mt-0.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="leading-tight">{error}</p>
                </div>
              )}

              {/* Input Area */}
              <footer 
                className="p-3 border-t flex-shrink-0"
                style={{
                  borderTopColor: "var(--ui-border)",
                  background: "var(--ui-surface-2)"
                }}
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex items-end gap-1.5 rounded-xl border p-1.5"
                  style={{
                    borderColor: "var(--ui-border)",
                    background: "var(--ui-surface)"
                  }}
                >
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Message..."
                    className="flex-1 bg-transparent px-2 py-1 outline-none resize-none text-xs max-h-24 min-h-[28px]"
                    style={{ color: "var(--ui-text)" }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                    style={{
                      background: input.trim() && !sending ? "linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)" : "var(--ui-surface-2)",
                      color: input.trim() && !sending ? "#0a1428" : "var(--ui-subtle)",
                      cursor: input.trim() && !sending ? "pointer" : "not-allowed",
                    }}
                  >
                    <svg className="w-4 h-4 transform rotate-45 -translate-x-0.5 translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </footer>
            </>
          )}
        </div>
      )}
    </>
  );
}

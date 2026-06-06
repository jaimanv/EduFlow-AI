import { useState, useRef, useEffect } from "react";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { supabase } from "@/lib/supabase";

export default function RoomChat({ roomId }: { roomId: string }) {
  const { messages, loading, sendMessage } = useRealtimeChat(roomId);
  const [newMessage, setNewMessage] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id || null));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
    setNewMessage("");
  };

  if (loading) return <div className="p-4 text-[var(--ui-muted)] text-sm">Loading chat...</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => {
          const isMe = msg.user_id === myId;
          return (
            <div key={msg.id || i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              {!isMe && <span className="text-[10px] text-[var(--ui-muted)] mb-1">User</span>}
              <div 
                className="p-2.5 rounded-xl text-sm"
                style={{ 
                  background: isMe ? "#14b8a6" : "var(--ui-bg)", 
                  color: isMe ? "#ffffff" : "var(--ui-text)",
                  border: isMe ? "none" : "1px solid var(--ui-border)",
                  borderBottomRightRadius: isMe ? "4px" : "12px",
                  borderBottomLeftRadius: !isMe ? "4px" : "12px",
                  maxWidth: "85%"
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 flex gap-2 flex-shrink-0" style={{ borderTop: "1px solid var(--ui-border)" }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Message..."
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--ui-bg)", border: "1px solid var(--ui-border)", color: "var(--ui-text)" }}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity duration-150"
          style={{ background: "linear-gradient(135deg,#6EE7D8,#14B8A6)", color: "#0d2420", opacity: !newMessage.trim() ? 0.5 : 1 }}
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

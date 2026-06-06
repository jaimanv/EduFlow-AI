import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function SharedNotes({ roomId }: { roomId: string }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const fetchNotes = async () => {
      const { data } = await supabase.from("room_notes").select("content").eq("room_id", roomId).single();
      if (data) setContent(data.content || "");
      setLoading(false);
    };
    fetchNotes();

    const channel = supabase.channel(`notes:${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "room_notes", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setContent(payload.new.content || "");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await supabase.from("room_notes").update({ content: newContent, updated_at: new Date().toISOString() }).eq("room_id", roomId);
    }, 500);
  };

  if (loading) return <div className="p-6 text-[var(--ui-muted)]">Loading notes...</div>;

  return (
    <textarea
      value={content}
      onChange={handleChange}
      placeholder="Start typing shared notes here..."
      className="w-full h-full p-6 bg-transparent outline-none resize-none text-[var(--ui-text)]"
      style={{ lineHeight: "1.6" }}
    />
  );
}

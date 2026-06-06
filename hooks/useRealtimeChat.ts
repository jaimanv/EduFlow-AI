import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useRealtimeChat(roomId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("room_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      
      if (data) {
        setMessages(data);
      }
      setLoading(false);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const sendMessage = async (content: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    
    // Optimistic update
    const tempId = Math.random().toString();
    const tempMsg = {
      id: tempId,
      room_id: roomId,
      user_id: user.user.id,
      content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    const { error } = await supabase.from("room_messages").insert({
      room_id: roomId,
      user_id: user.user.id,
      content
    });

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  return { messages, loading, sendMessage };
}

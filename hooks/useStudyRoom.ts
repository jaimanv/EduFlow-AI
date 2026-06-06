import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useStudyRoom(roomId: string) {
  const [presence, setPresence] = useState<any[]>([]);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: {
          key: "",
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flatMap((s: any) => s);
        // deduplicate by user_id
        const unique = Array.from(new Map(users.map(item => [item.user_id, item])).values());
        setPresence(unique);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data: user } = await supabase.auth.getUser();
          if (user.user) {
            // we ignore the exact name fetch for simplicity, just fallback to user
            await channel.track({
              user_id: user.user.id,
              name: user.user.email?.split("@")[0] || "User",
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return { presence };
}

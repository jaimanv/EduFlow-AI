"use client";


import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import RoomChat from "../../../../components/RoomChat";
import SharedNotes from "../../../../components/SharedNotes";
import MemberList from "../../../../components/MemberList";
import RoomTimer from "../../../../components/RoomTimer";

export default function StudyRoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  const [room, setRoom] = useState<any>(null);

  useEffect(() => {
    const fetchRoom = async () => {
      const { data } = await supabase.from("study_rooms").select("*").eq("id", roomId).single();
      setRoom(data);
    };
    fetchRoom();
  }, [roomId]);

  if (!room) return <div className="p-6 text-[var(--ui-text)]">Loading room...</div>;

  return (
    <div className="flex flex-col md:flex-row w-full" style={{ height: "calc(100vh - 64px)" }}>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0" style={{ borderRight: "1px solid var(--ui-border)" }}>
        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between flex-shrink-0 gap-4" style={{ borderBottom: "1px solid var(--ui-border)", background: "var(--ui-surface)" }}>
          <div>
            <h1 className="text-xl font-bold text-[var(--ui-text)]">{room.name}</h1>
            <p className="text-xs text-[var(--ui-muted)] select-all">ID: {room.id}</p>
          </div>
          <RoomTimer roomId={roomId} initialStatus={room.timer_status} initialDuration={room.timer_duration} />
        </div>
        <div className="flex-1 overflow-hidden">
          <SharedNotes roomId={roomId} />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col" style={{ background: "var(--ui-surface)", borderLeft: "1px solid var(--ui-border)" }}>
        <div className="p-4" style={{ borderBottom: "1px solid var(--ui-border)" }}>
          <h2 className="text-sm font-semibold text-[var(--ui-text)] mb-2">Members</h2>
          <MemberList roomId={roomId} />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <h2 className="text-sm font-semibold text-[var(--ui-text)] p-4 pb-0">Chat</h2>
          <RoomChat roomId={roomId} />
        </div>
      </div>
    </div>
  );
}

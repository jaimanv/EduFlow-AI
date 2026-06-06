import { useStudyRoom } from "@/hooks/useStudyRoom";

export default function MemberList({ roomId }: { roomId: string }) {
  const { presence } = useStudyRoom(roomId);

  return (
    <div className="flex flex-col gap-3">
      {presence.map((user, i) => (
        <div key={user.user_id || i} className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#0d2420] text-xs font-bold" style={{ background: "linear-gradient(135deg,#6EE7D8,#14B8A6)" }}>
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full" style={{ border: "2px solid var(--ui-surface)" }}></div>
          </div>
          <span className="text-sm font-medium text-[var(--ui-text)] truncate">{user.name}</span>
        </div>
      ))}
      {presence.length === 0 && (
        <div className="text-xs text-[var(--ui-muted)]">Waiting for members...</div>
      )}
    </div>
  );
}

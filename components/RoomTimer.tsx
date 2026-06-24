import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function RoomTimer({ roomId, initialStatus, initialDuration = 25 }: { roomId: string, initialStatus: string, initialDuration?: number }) {
  const [timeLeft, setTimeLeft] = useState(initialDuration * 60);
  const [status, setStatus] = useState(initialStatus || 'stopped');

  useEffect(() => {
    let interval: any;
    if (status === 'running') {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setStatus('stopped');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

const toggleTimer = async () => {
    const newStatus = status === "running" ? "stopped" : "running"
    const previousStatus = status

    setStatus(newStatus)
    if (newStatus === "running") setTimeLeft(initialDuration * 60)

    try {
        const { error } = await supabase
            .from("study_rooms")
            .update({ timer_status: newStatus })
            .eq("id", roomId)

        if (error) throw error
    } catch (err) {
        console.error("Failed to update timer:", err)
        setStatus(previousStatus)
        toast.error("Couldn't update timer. Please try again.") 
    }
}

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center gap-3">
      <div className="font-mono text-xl font-semibold tracking-wider" style={{ color: status === 'running' ? '#14b8a6' : 'var(--ui-text)' }}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <button 
        onClick={toggleTimer}
        className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150"
        style={{ 
          background: status === 'running' ? "rgba(239,68,68,0.1)" : "rgba(20,184,166,0.1)", 
          color: status === 'running' ? "#ef4444" : "#14b8a6" 
        }}
      >
        {status === 'running' ? 'Stop' : 'Start'}
      </button>
    </div>
  );
}

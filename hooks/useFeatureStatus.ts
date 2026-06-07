import { useEffect, useState } from "react";

export type FeatureStatus = {
  supabase: { active: boolean };
  ai: { active: boolean; message: string };
  email: { active: boolean; message: string };
};

export function useFeatureStatus() {
  const [status, setStatus] = useState<FeatureStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/features/status")
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setStatus(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch feature status:", err);
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return { status, loading };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

// ---------- Types ----------

export type Recommendation = {
  type: string;
  title: string;
  message: string;
  reason: string;
  priority: "high" | "medium" | "low";
  actionLabel: string;
  actionHref: string;
};

export type RecommendationsState = {
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;
  generatedAt: string | null;
  /** Raw fallback text if JSON parsing failed on the API side */
  rawInsight: string | null;
};

// ---------- Cache ----------

const CACHE_KEY = "eduflow_recommendations_cache";
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

type CachedData = {
  recommendations: Recommendation[];
  generatedAt: string;
  rawInsight: string | null;
  cachedAt: number;
};

function getCachedRecommendations(): CachedData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedData;
    if (Date.now() - data.cachedAt > CACHE_DURATION_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function setCachedRecommendations(data: Omit<CachedData, "cachedAt">) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...data, cachedAt: Date.now() }),
    );
  } catch {
    // Storage full — silently ignore
  }
}

// ---------- Hook ----------

export function useRecommendations() {
  const [state, setState] = useState<RecommendationsState>({
    recommendations: [],
    loading: true,
    error: null,
    generatedAt: null,
    rawInsight: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetchRecommendations = useCallback(
    async (force = false) => {
      // Check cache first (unless forced)
      if (!force) {
        const cached = getCachedRecommendations();
        if (cached) {
          setState({
            recommendations: cached.recommendations,
            loading: false,
            error: null,
            generatedAt: cached.generatedAt,
            rawInsight: cached.rawInsight,
          });
          return;
        }
      }

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Get current user's access token for auth
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        const body: Record<string, unknown> = {};

        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        } else {
          // Fallback: send userId in body
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user?.id) {
            body.userId = user.id;
          }
        }

        const response = await fetch("/api/recommendations", {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        const data = (await response.json()) as {
          recommendations?: Recommendation[];
          generatedAt?: string;
          rawInsight?: string;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        const recs = data.recommendations ?? [];
        const generatedAt = data.generatedAt ?? new Date().toISOString();
        const rawInsight = data.rawInsight ?? null;

        // Cache the results
        setCachedRecommendations({
          recommendations: recs,
          generatedAt,
          rawInsight,
        });

        setState({
          recommendations: recs,
          loading: false,
          error: null,
          generatedAt,
          rawInsight,
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;

        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            err instanceof Error
              ? err.message
              : "Failed to load recommendations.",
        }));
      }
    },
    [],
  );

  // Auto-fetch on mount
  useEffect(() => {
    fetchRecommendations(false);
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchRecommendations]);

  const refresh = useCallback(() => {
    // Clear cache and force fetch
    localStorage.removeItem(CACHE_KEY);
    return fetchRecommendations(true);
  }, [fetchRecommendations]);

  return { ...state, refresh };
}

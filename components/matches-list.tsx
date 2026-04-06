"use client";

import { createClient } from "@/lib/supabase/client";
import { Match } from "@/types";
import { useState } from "react";
import MatchRow from "./match-row";
import MatchesSkeleton from "@/app/(main)/matches/matches-skeleton";
import { CalendarClock, CheckCheck } from "lucide-react";

type Props = {
  initialMatches: Match[];
  pageSize: number;
};

type MatchFilter = "scheduled" | "completed";

export default function MatchesList({ initialMatches, pageSize }: Props) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [filter, setFilter] = useState<MatchFilter>("scheduled");
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialMatches.length === pageSize);
  const [error, setError] = useState<string | null>(null);

  async function fetchMatches(
    selectedFilter: MatchFilter,
    from = 0,
    reset = false,
  ) {
    const supabase = createClient();
    const to = from + pageSize - 1;

    let query = supabase
      .from("matches_with_details")
      .select("*")
      .order("kickoff_at", { ascending: true });

    if (selectedFilter === "scheduled") {
      query = query.in("status", ["scheduled", "live"]);
    } else {
      query = query.eq("status", "completed");
    }

    const { data, error } = await query.range(from, to);

    if (error) {
      throw new Error("No se pudieron cargar los partidos");
    }

    const newMatches = (data ?? []) as Match[];

    if (reset) {
      setMatches(newMatches);
    } else {
      setMatches((prev) => [...prev, ...newMatches]);
    }

    setHasMore(newMatches.length === pageSize);
  }

  async function handleFilterChange(selectedFilter: MatchFilter) {
    if (selectedFilter === filter || loadingFilter || loadingMore) return;

    setFilter(selectedFilter);
    setLoadingFilter(true);
    setError(null);

    try {
      await fetchMatches(selectedFilter, 0, true);
    } catch {
      setError("No se pudieron cargar los partidos");
      setMatches([]);
      setHasMore(false);
    } finally {
      setLoadingFilter(false);
    }
  }

  async function handleLoadMore() {
    if (loadingMore || loadingFilter || !hasMore) return;

    setLoadingMore(true);
    setError(null);

    try {
      await fetchMatches(filter, matches.length, false);
    } catch {
      setError("No se pudieron cargar más partidos");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center gap-3 sm:justify-start">
        <button
          type="button"
          onClick={() => handleFilterChange("scheduled")}
          disabled={loadingFilter || loadingMore}
          className={`flex cursor-pointer items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition hover:scale-95 ${
            filter === "scheduled"
              ? "bg-[#2A398D] text-white"
              : "border border-white/10 bg-black/40 text-white/80 hover:bg-black/50"
          }`}
        >
          <CalendarClock />
          PROGRAMADOS
        </button>

        <button
          type="button"
          onClick={() => handleFilterChange("completed")}
          disabled={loadingFilter || loadingMore}
          className={`flex cursor-pointer items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition hover:scale-95 ${
            filter === "completed"
              ? "bg-[#2A398D] text-white"
              : "border border-white/10 bg-black/40 text-white/80 hover:bg-black/50"
          }`}
        >
          <CheckCheck />
          JUGADOS
        </button>
      </div>

      {loadingFilter ? (
        <MatchesSkeleton />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {matches.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </div>

          {matches.length === 0 && !error && (
            <p className="text-center text-sm text-white/70">
              No hay partidos para este filtro.
            </p>
          )}

          {error && <p className="text-center text-sm text-red-300">{error}</p>}

          {hasMore && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore || loadingFilter}
                className="w-3xs cursor-pointer rounded-2xl border border-[#2A398D]/15 bg-white/85 px-6 py-3 text-[16px] font-bold text-[#2A398D] transition hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingMore ? "CARGANDO..." : "CARGAR MÁS"}
              </button>
            </div>
          )}

          {loadingMore && <MatchesSkeleton />}
        </>
      )}
    </div>
  );
}

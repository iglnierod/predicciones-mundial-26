"use client";

import { MatchWithPrediction } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import MatchRow from "./match-row";
import MatchesSkeleton from "@/app/(main)/matches/matches-skeleton";
import { CalendarClock, CheckCheck, LoaderCircle } from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import ViewPredictionsModalContent from "./view-predictions-modal-content";
import { isPredictionClosed } from "@/lib/format/match";
import { loadMatches, saveMatchPrediction } from "@/app/(main)/matches/actions";

type Props = {
  initialMatches: MatchWithPrediction[];
  initialFilter: MatchFilter;
  pageSize: number;
};

type MatchFilter = "scheduled" | "completed";

function getTabFromFilter(filter: MatchFilter) {
  return filter === "completed" ? "played" : "scheduled";
}

function getFilterFromTab(tab: string | null): MatchFilter {
  return tab === "played" ? "completed" : "scheduled";
}

export default function MatchesList({
  initialMatches,
  initialFilter,
  pageSize,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilter = getFilterFromTab(searchParams.get("tab"));

  const [matches, setMatches] = useState<MatchWithPrediction[]>(initialMatches);
  const [filter, setFilter] = useState<MatchFilter>(initialFilter);
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialMatches.length === pageSize);
  const [error, setError] = useState<string | null>(null);

  const MySwal = withReactContent(Swal);

  const fetchMatches = useCallback(
    async function fetchMatches(
      selectedFilter: MatchFilter,
      from = 0,
      reset = false,
    ) {
      const result = await loadMatches({
        filter: selectedFilter,
        from,
        pageSize,
      });

      if (!result.success) {
        throw new Error(result.error ?? "No se pudieron cargar los partidos");
      }

      const newMatches = result.data;

      if (reset) {
        setMatches(newMatches);
      } else {
        setMatches((prev) => [...prev, ...newMatches]);
      }

      setHasMore(newMatches.length === pageSize);
    },
    [pageSize],
  );

  useEffect(() => {
    if (initialFilter === urlFilter) return;

    const timeoutId = window.setTimeout(() => {
      setFilter(urlFilter);
      setLoadingFilter(true);
      setError(null);

      void fetchMatches(urlFilter, 0, true)
        .catch(() => {
          setError("No se pudieron cargar los partidos");
          setMatches([]);
          setHasMore(false);
        })
        .finally(() => {
          setLoadingFilter(false);
        });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchMatches, initialFilter, urlFilter]);

  async function handleFilterChange(selectedFilter: MatchFilter) {
    if (selectedFilter === filter || loadingFilter || loadingMore) return;

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set("tab", getTabFromFilter(selectedFilter));
    router.replace(`${pathname}?${nextSearchParams.toString()}`, {
      scroll: false,
    });

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

  async function handleMakePrediction(
    matchId: number,
    kickoffAt: string,
    matchPredictedHomeScore: number | null,
    matchPredictedAwayScore: number | null,
    predictedHomeScore: number,
    predictedAwayScore: number,
  ): Promise<{ saved: boolean; errorMessage: string | null }> {
    if (
      predictedHomeScore < 0 ||
      predictedHomeScore > 10 ||
      predictedAwayScore < 0 ||
      predictedAwayScore > 10
    ) {
      return { saved: false, errorMessage: "Resultado no válido" };
    }

    if (
      matchPredictedHomeScore === predictedHomeScore &&
      matchPredictedAwayScore === predictedAwayScore
    ) {
      return { saved: false, errorMessage: null };
    }

    if (isPredictionClosed(kickoffAt)) {
      return {
        saved: false,
        errorMessage: "La predicción está cerrada.",
      };
    }

    const result = await saveMatchPrediction({
      matchId,
      predictedHomeScore,
      predictedAwayScore,
    });

    if (!result.success || !result.data) {
      return {
        saved: false,
        errorMessage: result.error ?? "No se pudo guardar la predicción",
      };
    }

    setMatches((prev) =>
      prev.map((match) =>
        match.id === matchId
          ? {
              ...match,
              predicted_home_score: result.data.predicted_home_score,
              predicted_away_score: result.data.predicted_away_score,
            }
          : match,
      ),
    );

    return { saved: true, errorMessage: null };
  }

  async function handleViewPredictions(matchId: number) {
    const match = matches.find((item) => item.id === matchId);

    if (!match) {
      await Swal.fire({
        icon: "error",
        title: "No se encontró el partido",
        confirmButtonText: "Cerrar",
      });
      return;
    }

    await MySwal.fire({
      html: <ViewPredictionsModalContent match={match} />,
      showCloseButton: true,
      showConfirmButton: false,
      width: 700,
      padding: "1rem",
      customClass: {
        popup: "!rounded-xl",
        htmlContainer: "!m-0 !p-0 text-left",
        closeButton: "!text-black/50 hover:!text-black",
      },
    });
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <MatchRow
                key={match.id}
                match={match}
                onMakePrediction={handleMakePrediction}
                onViewPredictions={handleViewPredictions}
              />
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
                className="flex cursor-pointer items-center gap-1 rounded-2xl border border-[#2A398D]/15 bg-white/85 px-5 py-3 text-[16px] font-bold text-[#2A398D] transition hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingMore ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    <span>CARGANDO...</span>
                  </>
                ) : (
                  "CARGAR MÁS"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

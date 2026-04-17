"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  LeaderboardProfile,
  MatchPrediction,
  MatchPredictionBreakdown,
  MatchPredictionOverview,
  MatchWithTeam,
} from "@/types";

type Props = {
  profile: LeaderboardProfile;
  viewerUserId?: string;
};

const PAGE_SIZE = 4;

type MatchQueryRelation<T> = T | T[] | null;

type MatchRowQuery = {
  id: number;
  round: string;
  kickoff_at: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  stadium: string | null;
  stadium_city: string | null;
  stadium_country: string | null;
  groups: MatchQueryRelation<{
    name: string | null;
  }>;
  home_team: MatchQueryRelation<{
    name: string;
    code: string;
    flag_code: string;
  }>;
  away_team: MatchQueryRelation<{
    name: string;
    code: string;
    flag_code: string;
  }>;
};

type MatchPredictionWithMeta = MatchPrediction & {
  full_name: string;
  points: number | null;
  is_calculated: boolean;
  breakdown: MatchPredictionBreakdown | null;
};

type MatchCompareItem = {
  match: MatchWithTeam;
  viewerPrediction: MatchPredictionWithMeta | null;
  profilePrediction: MatchPredictionWithMeta | null;
};

export default function MatchesTab({ profile, viewerUserId }: Props) {
  const [items, setItems] = useState<MatchCompareItem[]>([]);
  const [page, setPage] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const isOwnProfile = viewerUserId === profile.user_id;

  const loadPage = useCallback(
    async (pageToLoad: number, mode: "replace" | "append") => {
      if (!viewerUserId) {
        setItems([]);
        setHasMore(false);
        setLoadingInitial(false);
        return;
      }

      const supabase = createClient();
      const from = pageToLoad * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      if (mode === "replace") {
        setLoadingInitial(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      try {
        const { data: matchesData, error: matchesError } = await supabase
          .from("matches")
          .select(
            `
              id,
              round,
              kickoff_at,
              status,
              home_score,
              away_score,
              stadium,
              stadium_city,
              stadium_country,
              groups (
                name
              ),
              home_team:teams!matches_home_team_id_fkey (
                name,
                code,
                flag_code
              ),
              away_team:teams!matches_away_team_id_fkey (
                name,
                code,
                flag_code
              )
            `,
          )
          .eq("status", "completed")
          .order("kickoff_at", { ascending: false })
          .range(from, to);

        if (matchesError) {
          throw new Error("No se pudieron cargar los partidos");
        }

        const rawMatches = (matchesData ?? []) as MatchRowQuery[];

        function getSingleRelation<T>(value: T | T[] | null): T | null {
          if (!value) return null;
          return Array.isArray(value) ? (value[0] ?? null) : value;
        }

        const parsedMatches: MatchWithTeam[] = rawMatches.map((match) => {
          const group = getSingleRelation(match.groups);
          const homeTeam = getSingleRelation(match.home_team);
          const awayTeam = getSingleRelation(match.away_team);

          return {
            id: match.id,
            round: match.round,
            kickoff_at: match.kickoff_at,
            status: match.status,
            home_score: match.home_score,
            away_score: match.away_score,
            stadium: match.stadium,
            stadium_city: match.stadium_city,
            stadium_country: match.stadium_country,
            group_name: group?.name ?? null,
            home_team_name: homeTeam?.name ?? "",
            home_team_code: homeTeam?.code ?? "",
            home_team_flag_code: homeTeam?.flag_code ?? "",
            away_team_name: awayTeam?.name ?? "",
            away_team_code: awayTeam?.code ?? "",
            away_team_flag_code: awayTeam?.flag_code ?? "",
          };
        });

        const matchIds = parsedMatches.map((match) => match.id);
        const userIds = isOwnProfile
          ? [profile.user_id]
          : [profile.user_id, viewerUserId];

        let predictionMap = new Map<string, MatchPredictionWithMeta>();

        if (matchIds.length > 0) {
          const { data: predictionsData, error: predictionsError } =
            await supabase
              .from("match_predictions_result_overview")
              .select(
                `
                  user_id,
                  match_id,
                  predicted_home_score,
                  predicted_away_score,
                  full_name,
                  points,
                  is_calculated,
                  breakdown
                `,
              )
              .in("match_id", matchIds)
              .in("user_id", userIds)
              .eq("is_calculated", true);

          if (predictionsError) {
            throw new Error("No se pudieron cargar las predicciones");
          }

          const typedPredictions = (predictionsData ??
            []) as MatchPredictionOverview[];

          predictionMap = new Map(
            typedPredictions.map((row) => [
              `${row.match_id}-${row.user_id}`,
              {
                user_id: row.user_id,
                match_id: row.match_id,
                predicted_home_score: row.predicted_home_score,
                predicted_away_score: row.predicted_away_score,
                full_name: row.full_name,
                points: row.points,
                is_calculated: row.is_calculated,
                breakdown: row.breakdown,
              },
            ]),
          );
        }

        const nextItems: MatchCompareItem[] = parsedMatches.map((match) => ({
          match,
          viewerPrediction: viewerUserId
            ? (predictionMap.get(`${match.id}-${viewerUserId}`) ?? null)
            : null,
          profilePrediction:
            predictionMap.get(`${match.id}-${profile.user_id}`) ?? null,
        }));

        setHasMore(parsedMatches.length === PAGE_SIZE);

        if (mode === "replace") {
          setItems(nextItems);
        } else {
          setItems((prev) => [...prev, ...nextItems]);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Se produjo un error al cargar los partidos",
        );
      } finally {
        setLoadingInitial(false);
        setLoadingMore(false);
      }
    },
    [isOwnProfile, profile.user_id, viewerUserId],
  );

  useEffect(() => {
    setPage(0);
    void loadPage(0, "replace");
  }, [loadPage]);

  async function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    await loadPage(nextPage, "append");
  }

  if (!viewerUserId) {
    return (
      <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-extrabold text-black">Partidos</h3>
        <p className="mt-2 text-sm leading-6 text-black/65">
          Debes iniciar sesión para comparar predicciones por partido.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-100 space-y-4">
      <section className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
            PARTIDOS
          </span>

          <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold tracking-wide text-black/70">
            {profile.match_points} puntos
          </span>
        </div>

        <h3 className="text-lg font-extrabold text-black">
          Comparación por partidos
        </h3>

        <p className="mt-2 text-sm leading-6 text-black/65">
          Aquí puedes comparar las predicciones de{" "}
          <span className="font-semibold text-black">
            {profile.full_name ?? "este usuario"}
          </span>{" "}
          con las tuyas en los partidos ya calculados.
        </p>
      </section>

      {loadingInitial ? (
        <MatchesTabSkeleton />
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">No se pudieron cargar los partidos</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
          <p className="text-sm text-black/60">
            Todavía no hay partidos calculados para mostrar.
          </p>
        </div>
      ) : (
        <>
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-4 md:grid-cols-2">
            {" "}
            {items.map((item) => (
              <MatchComparisonCard
                key={item.match.id}
                item={item}
                profileName={profile.full_name ?? "Usuario"}
                isOwnProfile={isOwnProfile}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[#2A398D]/15 bg-white px-4 py-2 text-sm font-semibold text-[#2A398D] transition hover:bg-[#2A398D]/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  "Mostrar más"
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MatchComparisonCard({
  item,
  profileName,
  isOwnProfile,
}: {
  item: MatchCompareItem;
  profileName: string;
  isOwnProfile: boolean;
}) {
  const { match, viewerPrediction, profilePrediction } = item;

  return (
    <article className="mb-4 self-start overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/10 px-3 py-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center justify-end gap-2 text-right">
            <span className="truncate text-base font-extrabold text-black">
              {match.home_team_name}
            </span>

            <div className="overflow-hidden rounded-tr-xl rounded-bl-xl border border-black/5 bg-white shadow-sm">
              <Image
                src={`https://flagcdn.com/w160/${match.home_team_flag_code}.png`}
                alt={`Bandera de ${match.home_team_name}`}
                width={40}
                height={28}
                className="h-7 w-10 object-cover"
              />
            </div>
          </div>

          <div className="text-center text-2xl font-extrabold text-black/80">
            {match.home_score} - {match.away_score}
          </div>

          <div className="flex items-center gap-2">
            <div className="overflow-hidden rounded-tl-xl rounded-br-xl border border-black/5 bg-white shadow-sm">
              <Image
                src={`https://flagcdn.com/w160/${match.away_team_flag_code}.png`}
                alt={`Bandera de ${match.away_team_name}`}
                width={40}
                height={28}
                className="h-7 w-10 object-cover"
              />
            </div>

            <span className="truncate text-base font-extrabold text-black">
              {match.away_team_name}
            </span>
          </div>
        </div>
      </div>
      {isOwnProfile ? (
        <PredictionAccordionRow
          label="Tu predicción"
          prediction={profilePrediction}
          highlighted
        />
      ) : (
        <>
          <PredictionAccordionRow
            label="Tu predicción"
            prediction={viewerPrediction}
          />
          <PredictionAccordionRow
            label={profileName}
            prediction={profilePrediction}
            highlighted
          />
        </>
      )}
    </article>
  );
}

function PredictionAccordionRow({
  label,
  prediction,
  highlighted = false,
}: {
  label: string;
  prediction: MatchPredictionWithMeta | null;
  highlighted?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const hasBreakdown = Boolean(prediction?.breakdown);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (hasBreakdown) setOpen((prev) => !prev);
        }}
        className={`grid w-full grid-cols-[1fr_auto_1fr] items-center border-t border-black/10 px-3 py-2 text-left transition ${hasBreakdown ? "cursor-pointer hover:bg-black/2.5" : "cursor-default"}`}
      >
        <div className="text-sm text-black/80">{label}</div>

        <div className="px-2 text-center text-2xl font-extrabold text-black/85">
          {prediction
            ? `${prediction.predicted_home_score} - ${prediction.predicted_away_score}`
            : "—"}
        </div>

        <div className="flex items-center justify-end gap-2">
          {prediction ? (
            <span className="text-lg font-extrabold text-[#1D4ED8]">
              {prediction.points} pts
            </span>
          ) : (
            <span className="text-xs font-semibold text-black/40">
              Sin pred.
            </span>
          )}

          {hasBreakdown ? (
            open ? (
              <ChevronUp className="h-4 w-4 text-[#1D4ED8]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#1D4ED8]" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
        </div>
      </button>

      {open && prediction?.breakdown && (
        <div className="border-t border-black/10 bg-black/2 px-3 py-3">
          <PredictionBreakdown breakdown={prediction.breakdown} />
        </div>
      )}
    </>
  );
}

function PredictionBreakdown({
  breakdown,
}: {
  breakdown: MatchPredictionBreakdown;
}) {
  return (
    <div className="space-y-2 text-sm text-black/70">
      <div className="grid gap-2 sm:grid-cols-2">
        <BreakdownItem label="Regla" value={getRuleText(breakdown.ruleKey)} />
        <BreakdownItem label="Puntos" value={String(breakdown.points)} />
        <BreakdownItem
          label="Resultado real"
          value={formatResultLabel(breakdown.realResult)}
        />
        <BreakdownItem
          label="Resultado predicho"
          value={formatResultLabel(breakdown.predictedResult)}
        />
        <BreakdownItem
          label="Marcador real"
          value={formatScore(breakdown.realHomeScore, breakdown.realAwayScore)}
        />
        <BreakdownItem
          label="Marcador predicho"
          value={formatScore(
            breakdown.predictedHomeScore,
            breakdown.predictedAwayScore,
          )}
        />
        <BreakdownItem
          label="Diferencia real"
          value={formatNullableNumber(breakdown.realDifference)}
        />
        <BreakdownItem
          label="Diferencia predicha"
          value={formatNullableNumber(breakdown.predictedDifference)}
        />
      </div>
    </div>
  );
}

function BreakdownItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white px-3 py-2 shadow-sm">
      <p className="text-[11px] font-bold tracking-wide text-black/45 uppercase">
        {label}
      </p>
      <p className="mt-1 font-semibold text-black">{value}</p>
    </div>
  );
}

function getRuleText(ruleKey: string | null | undefined): string {
  if (ruleKey === "match_winner_only") return "Adivina ganador";
  if (ruleKey === "match_winner_and_difference") {
    return "Adivina ganador y diferencia";
  }
  if (ruleKey === "match_one_team_goals") return "Adivina goles de un equipo";
  return "Regla estándar";
}

function formatResultLabel(result: string | null | undefined): string {
  if (result === "home") return "Gana local";
  if (result === "away") return "Gana visitante";
  if (result === "draw") return "Empate";
  return "—";
}

function formatScore(
  home: number | null | undefined,
  away: number | null | undefined,
): string {
  if (home == null || away == null) return "—";
  return `${home} - ${away}`;
}

function formatNullableNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return String(value);
}

function MatchesTabSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm"
        >
          <div className="border-b border-black/10 px-3 py-3">
            <div className="h-8 animate-pulse rounded-2xl bg-black/5" />
          </div>

          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center border-t border-black/10 px-3 py-2">
            <div className="h-4 w-24 animate-pulse rounded bg-black/5" />
            <div className="mx-2 h-7 w-16 animate-pulse rounded bg-black/5" />
            <div className="h-5 w-14 animate-pulse rounded bg-black/5" />
            <div className="h-4 w-4 animate-pulse rounded bg-black/5" />
          </div>

          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center border-t border-black/10 px-3 py-2">
            <div className="h-4 w-24 animate-pulse rounded bg-black/5" />
            <div className="mx-2 h-7 w-16 animate-pulse rounded bg-black/5" />
            <div className="h-5 w-14 animate-pulse rounded bg-black/5" />
            <div className="h-4 w-4 animate-pulse rounded bg-black/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Lock } from "lucide-react";
import {
  loadLeaderboardCompareStats,
  type LeaderboardCompareStats,
} from "@/app/(main)/leaderboard/actions";
import { LeaderboardProfile } from "@/types";

type Props = {
  profile: LeaderboardProfile;
  viewerUserId?: string;
  isOwnProfile: boolean;
};

export default function CompareTab({
  profile,
  viewerUserId,
  isOwnProfile,
}: Props) {
  const [stats, setStats] = useState<LeaderboardCompareStats | null>(null);
  const [loading, setLoading] = useState(
    Boolean(viewerUserId && !isOwnProfile),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCompareStats() {
      try {
        setLoading(true);
        setError(null);

        const result = await loadLeaderboardCompareStats(profile.user_id);

        if (!result.success) {
          throw new Error(
            result.error ?? "No se pudieron cargar las estadísticas",
          );
        }

        if (!isMounted) return;

        setStats(result.stats);
      } catch (err) {
        if (!isMounted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Se produjo un error al cargar la comparación",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (!viewerUserId || isOwnProfile) {
      return;
    }

    fetchCompareStats();

    return () => {
      isMounted = false;
    };
  }, [profile.user_id, viewerUserId, isOwnProfile]);

  if (!viewerUserId) {
    return (
      <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-extrabold text-black">Comparar</h3>
        <p className="mt-2 text-sm leading-6 text-black/65">
          Debes iniciar sesión para poder comparar este perfil con el tuyo.
        </p>
      </div>
    );
  }

  if (isOwnProfile) {
    return (
      <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-extrabold text-black">Comparar</h3>
        <p className="mt-2 text-sm leading-6 text-black/65">
          Estás viendo tu propio perfil, así que aquí no hay comparación que
          mostrar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
            COMPARACIÓN DIRECTA
          </span>
        </div>

        <h3 className="text-lg font-extrabold text-black">
          Tú vs {profile.full_name ?? "usuario"}
        </h3>

        <p className="mt-2 text-sm leading-6 text-black/65">
          Estadísticas directas con puntos, partidos calculados, grupos y
          predicciones globales disponibles.
        </p>
      </div>

      {loading ? (
        <CompareSkeleton />
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">No se pudo cargar la comparación</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        </div>
      ) : stats ? (
        <CompareOverview stats={stats} />
      ) : (
        <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
          <p className="text-sm text-black/60">
            No hay datos suficientes para comparar estos usuarios.
          </p>
        </div>
      )}
    </div>
  );
}

function CompareOverview({ stats }: { stats: LeaderboardCompareStats }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-black/5 bg-white/85 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm">
      <ScoreComparisonSection stats={stats} />
      <MatchComparisonStatsSection stats={stats} />
      <GroupComparisonSection stats={stats} />
      <GlobalComparisonSection stats={stats} />
    </article>
  );
}

function CompareSection({
  badge,
  title,
  children,
}: {
  badge: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-black/5 p-3 last:border-b-0 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#2A398D]/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#2A398D]">
          {badge}
        </span>
        <h4 className="text-sm font-extrabold text-black">{title}</h4>
      </div>

      {children}
    </section>
  );
}

function ScoreComparisonSection({ stats }: { stats: LeaderboardCompareStats }) {
  return (
    <CompareSection badge="PUNTOS" title="Resumen de puntuación">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <HighlightMetric
          label="Diferencia total"
          value={formatDifference(stats.score.totalDifference)}
          positive={stats.score.totalDifference > 0}
        />
        <HighlightMetric
          label="Diferencia ranking"
          value={formatRankDifference(stats.score.rankDifference)}
          positive={stats.score.rankDifference > 0}
        />
      </div>

      <div className="space-y-1.5">
        {stats.score.categories.map((category) => (
          <ComparisonRow
            key={category.label}
            label={category.label}
            viewerLabel="Tú"
            profileLabel={stats.profileName}
            viewerValue={category.viewer}
            profileValue={category.profile}
          />
        ))}
      </div>
    </CompareSection>
  );
}

function MatchComparisonStatsSection({
  stats,
}: {
  stats: LeaderboardCompareStats;
}) {
  const { matches } = stats;

  return (
    <CompareSection badge="PARTIDOS" title="Partidos calculados">
      <div className="mb-3 grid grid-cols-2 gap-2">
        <HighlightMetric
          label="Partidos en común"
          value={String(matches.commonCalculatedMatches)}
        />
        <HighlightMetric
          label="Duelos ganados"
          value={`${matches.viewerWins} - ${matches.profileWins}`}
          positive={matches.viewerWins > matches.profileWins}
        />
      </div>

      <div className="space-y-1.5">
        <ComparisonRow
          label="Puntos en común"
          viewerLabel="Tú"
          profileLabel={stats.profileName}
          viewerValue={matches.viewerPoints}
          profileValue={matches.profilePoints}
        />
        <ComparisonRow
          label="Media por partido"
          viewerLabel="Tú"
          profileLabel={stats.profileName}
          viewerValue={formatAverage(matches.viewerAverage)}
          profileValue={formatAverage(matches.profileAverage)}
        />
        <ComparisonRow
          label="Marcadores exactos"
          viewerLabel="Tú"
          profileLabel={stats.profileName}
          viewerValue={matches.viewerExactScores}
          profileValue={matches.profileExactScores}
        />
        <ComparisonRow
          label="Ganador acertado"
          viewerLabel="Tú"
          profileLabel={stats.profileName}
          viewerValue={matches.viewerWinnerHits}
          profileValue={matches.profileWinnerHits}
        />
      </div>

      <p className="mt-2 text-xs font-medium text-black/45">
        Empates en puntos partido a partido: {matches.ties}
      </p>
    </CompareSection>
  );
}

function GroupComparisonSection({ stats }: { stats: LeaderboardCompareStats }) {
  const { groups } = stats;

  return (
    <CompareSection badge="GRUPOS" title="Coincidencias de grupos">
      {!groups.canCompare ? (
        <LockedMessage />
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <HighlightMetric
              label="Grupos idénticos"
              value={String(groups.sameGroups)}
            />
            <HighlightMetric
              label="Equipos coincidentes"
              value={String(groups.matchingTeams)}
            />
          </div>
        </>
      )}
    </CompareSection>
  );
}

function GlobalComparisonSection({
  stats,
}: {
  stats: LeaderboardCompareStats;
}) {
  const { globals } = stats;

  return (
    <CompareSection badge="GLOBALES" title="Predicciones del torneo">
      {!globals.canCompare ? (
        <LockedMessage />
      ) : (
        <>
          <div className="space-y-1.5">
            <HighlightMetric
              label="Coincidencias"
              value={`${globals.samePredictions}/12`}
            />
            <ComparisonRow
              label="Predicciones completadas"
              viewerLabel="Tú"
              profileLabel={stats.profileName}
              viewerValue={globals.viewerCompleted}
              profileValue={globals.profileCompleted}
            />
          </div>
        </>
      )}
    </CompareSection>
  );
}

function HighlightMetric({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#2A398D]/10 bg-[#2A398D]/5 p-2.5 text-center">
      <p className="text-[10px] font-bold tracking-wide text-black/45 uppercase">
        {label}
      </p>
      <p
        className={
          positive
            ? "mt-1 text-2xl leading-none font-extrabold text-emerald-700"
            : "mt-1 text-2xl leading-none font-extrabold text-[#2A398D]"
        }
      >
        {value}
      </p>
    </div>
  );
}

function ComparisonRow({
  label,
  viewerLabel,
  profileLabel,
  viewerValue,
  profileValue,
}: {
  label: string;
  viewerLabel: string;
  profileLabel: string;
  viewerValue: number | string;
  profileValue: number | string;
}) {
  const numericViewerValue = Number(viewerValue);
  const numericProfileValue = Number(profileValue);
  const canCompareNumbers =
    !Number.isNaN(numericViewerValue) && !Number.isNaN(numericProfileValue);
  const viewerWins =
    canCompareNumbers && numericViewerValue > numericProfileValue;
  const profileWins =
    canCompareNumbers && numericProfileValue > numericViewerValue;

  return (
    <div className="grid grid-cols-[minmax(92px,1fr)_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-black/5 bg-black/3 px-3 py-2.5">
      <p className="text-[10px] font-bold tracking-wide text-black/45 uppercase">
        {label}
      </p>
      <ComparisonSide
        label={viewerLabel}
        value={viewerValue}
        highlighted={viewerWins}
      />
      <span className="rounded-full border border-black/5 bg-white px-2 py-0.5 text-[10px] font-extrabold text-black/35 shadow-sm">
        VS
      </span>
      <ComparisonSide
        label={profileLabel}
        value={profileValue}
        highlighted={profileWins}
      />
    </div>
  );
}

function ComparisonSide({
  label,
  value,
  highlighted,
}: {
  label: string;
  value: number | string;
  highlighted: boolean;
}) {
  return (
    <div className="min-w-0 text-center">
      <p className="truncate text-[11px] font-semibold text-black/50">
        {label}
      </p>
      <p
        className={
          highlighted
            ? "text-2xl leading-none font-extrabold text-[#2A398D]"
            : "text-2xl leading-none font-extrabold text-black/75"
        }
      >
        {value}
      </p>
    </div>
  );
}

function LockedMessage() {
  return (
    <div className="rounded-2xl border border-black/5 bg-black/3 p-3 text-black/60">
      <div className="flex items-start gap-2.5">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#2A398D]" />
        <div>
          <p className="font-bold text-black/75">Comparación bloqueada</p>
          <p className="mt-0.5 text-sm leading-5">
            Disponible cuando empiece el torneo para no revelar predicciones de
            otros usuarios antes de tiempo.
          </p>
        </div>
      </div>
    </div>
  );
}

function CompareSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-black/5 bg-white/85 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="border-b border-black/5 p-3 last:border-b-0 sm:p-4"
        >
          <div className="mb-3 h-5 w-20 animate-pulse rounded-full bg-[#2A398D]/10" />
          <div className="mb-3 h-4 w-36 animate-pulse rounded-full bg-black/5" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-14 animate-pulse rounded-2xl bg-black/5" />
            <div className="h-14 animate-pulse rounded-2xl bg-black/5" />
          </div>
          <div className="mt-2 h-11 animate-pulse rounded-2xl bg-black/5" />
        </div>
      ))}
    </div>
  );
}

function formatDifference(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function formatRankDifference(value: number) {
  if (value > 0) return `${value} puestos mejor`;
  if (value < 0) return `${Math.abs(value)} puestos peor`;
  return "Misma posición";
}

function formatAverage(value: number) {
  return value.toFixed(1);
}

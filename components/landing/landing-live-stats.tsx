"use client";

import type { LandingStats } from "@/lib/repositories/landing-stats-repository";
import { getRoundLabel } from "@/lib/format/match";
import { Activity, CalendarClock, Clock3, Trophy, Users } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type LandingLiveStatsProps = {
  stats: LandingStats;
};

type TournamentPhase = "before" | "during" | "after" | "unknown";

const numberFormatter = new Intl.NumberFormat("es-ES");
const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function getTournamentPhase(
  now: number,
  firstKickoffAt: string | null,
  lastKickoffAt: string | null,
): TournamentPhase {
  if (!firstKickoffAt) return "unknown";

  const firstKickoffTime = new Date(firstKickoffAt).getTime();
  const lastKickoffTime = lastKickoffAt
    ? new Date(lastKickoffAt).getTime()
    : null;

  if (now < firstKickoffTime) return "before";
  if (!lastKickoffTime || now <= lastKickoffTime) return "during";

  return "after";
}

function getCountdownParts(milliseconds: number) {
  const totalMinutes = Math.max(Math.floor(Math.abs(milliseconds) / 60000), 0);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return [
    { label: "Días", value: days },
    { label: "Horas", value: hours },
    { label: "Min", value: minutes },
  ];
}

function formatDate(value: string | null) {
  if (!value) return "Por confirmar";

  return dateFormatter.format(new Date(value));
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

type FeaturedTeamFlagProps = {
  team: NonNullable<LandingStats["featuredMatch"]>["homeTeam"];
  side: "home" | "away";
};

function FeaturedTeamFlag({ team, side }: FeaturedTeamFlagProps) {
  const flagCode = team.flagCode?.toLowerCase() ?? "un";
  const flagShape =
    side === "home"
      ? "rounded-tr-xl rounded-bl-xl"
      : "rounded-tl-xl rounded-br-xl";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={`overflow-hidden border border-black/5 bg-white shadow-sm ${flagShape}`}
      >
        <Image
          src={`https://flagcdn.com/w160/${flagCode}.png`}
          alt={`Bandera de ${team.name}`}
          width={72}
          height={48}
          className="h-10 w-15 object-cover"
          title={team.name}
        />
      </div>
      <span
        className="text-lg font-black tracking-wide text-white"
        title={team.name}
      >
        {team.code}
      </span>
    </div>
  );
}

export default function LandingLiveStats({ stats }: LandingLiveStatsProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const phase = getTournamentPhase(
    now,
    stats.firstKickoffAt,
    stats.lastKickoffAt,
  );
  const firstKickoffTime = stats.firstKickoffAt
    ? new Date(stats.firstKickoffAt).getTime()
    : null;
  const lastKickoffTime = stats.lastKickoffAt
    ? new Date(stats.lastKickoffAt).getTime()
    : null;
  const targetTime =
    phase === "before"
      ? firstKickoffTime
      : phase === "after"
        ? lastKickoffTime
        : lastKickoffTime;
  const countdownParts = getCountdownParts(targetTime ? targetTime - now : 0);
  const progress =
    stats.totalMatches > 0
      ? Math.min(
          Math.round((stats.completedMatches / stats.totalMatches) * 100),
          100,
        )
      : 0;

  const phaseCopy = {
    before: {
      eyebrow: "Cuenta atrás",
      title: "El Mundial empieza en",
      description:
        "Prepárate para completar tus predicciones antes del primer partido del Mundial 2026.",
      dateLabel: "Primer partido",
    },
    during: {
      eyebrow: "Mundial en juego",
      title: "Camino a la final",
      description:
        "Durante el torneo, estas estadísticas reflejan partidos jugados, actividad y predicciones guardadas.",
      dateLabel: "Último partido previsto",
    },
    after: {
      eyebrow: "Histórico del torneo",
      title: "El Mundial terminó hace",
      description:
        "Cuando finalice el Mundial, la página seguirá funcionando como resumen histórico de participación y resultados.",
      dateLabel: "Final registrado",
    },
    unknown: {
      eyebrow: "Datos del torneo",
      title: "Calendario pendiente",
      description:
        "En cuanto esté disponible el calendario, verás aquí el inicio del torneo y la actividad de la competición.",
      dateLabel: "Inicio del torneo",
    },
  }[phase];

  const statCards = [
    {
      label: "Partidos jugados",
      value: `${formatNumber(stats.completedMatches)}/${formatNumber(stats.totalMatches)}`,
      description: `${progress}% del calendario completado`,
      Icon: Trophy,
      tone: "bg-[#2A398D]",
    },
    {
      label: "Predicciones guardadas",
      value: formatNumber(stats.totalPredictions),
      description: "Partidos, grupos y pronósticos globales",
      Icon: Activity,
      tone: "bg-[#3CAC3B]",
    },
    {
      label: "Usuarios compitiendo",
      value: formatNumber(stats.totalUsers),
      description: "Usuarios registrados para competir",
      Icon: Users,
      tone: "bg-[#E61D25]",
    },
  ];

  return (
    <section
      id="estadisticas"
      aria-labelledby="estadisticas-heading"
      className="bg-white px-5 py-16 text-[#17202a] sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <article className="relative overflow-hidden rounded-[2.25rem] bg-[#2A398D] p-6 text-white shadow-[0_28px_90px_rgba(42,57,141,0.28)] md:p-8">
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#3CAC3B]/30" />
            <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-[#E61D25]/25" />

            <div className="relative">
              <p className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-black tracking-[0.18em] text-white/80 uppercase ring-1 ring-white/15">
                {phaseCopy.eyebrow}
              </p>
              <h2
                id="estadisticas-heading"
                className="mt-5 text-4xl font-black tracking-tight text-balance md:text-5xl"
              >
                {phaseCopy.title}
              </h2>

              <div className="mt-7 grid grid-cols-3 gap-3">
                {countdownParts.map((part) => (
                  <div
                    key={part.label}
                    className="rounded-3xl bg-white p-4 text-center text-[#2A398D] shadow-lg"
                  >
                    <p className="text-4xl leading-none font-black md:text-5xl">
                      {formatNumber(part.value)}
                    </p>
                    <p className="mt-2 text-[11px] font-black tracking-[0.18em] text-[#474A4A]/60 uppercase">
                      {part.label}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-lg leading-8 text-white/75">
                {phaseCopy.description}
              </p>

              <div className="mt-6 flex flex-col gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-white/15 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-black tracking-[0.18em] text-white/55 uppercase">
                    {phaseCopy.dateLabel}
                  </p>
                  <p className="mt-1 font-black text-white">
                    {formatDate(
                      phase === "after"
                        ? stats.lastKickoffAt
                        : stats.firstKickoffAt,
                    )}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#2A398D]">
                  <Clock3 className="h-4 w-4" aria-hidden />
                  Contador activo
                </div>
              </div>
            </div>
          </article>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-[#2A398D]/10 bg-[#F3F4F3] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black tracking-[0.18em] text-[#E61D25] uppercase">
                    Actividad real
                  </p>
                  <h3 className="mt-2 text-3xl font-black tracking-tight text-[#2A398D]">
                    El torneo en movimiento
                  </h3>
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#474A4A] shadow-sm">
                  {stats.liveMatches > 0
                    ? `${formatNumber(stats.liveMatches)} en directo`
                    : `${formatNumber(stats.scheduledMatches)} pendientes`}
                </div>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#2A398D]/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#2A398D,#3CAC3B,#E61D25)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {statCards.map(({ label, value, description, Icon, tone }) => (
                <article
                  key={label}
                  className="rounded-[2rem] border border-[#2A398D]/10 bg-white p-5 shadow-sm"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone} text-white`}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <p className="mt-5 text-[11px] font-black tracking-[0.16em] text-[#474A4A]/60 uppercase">
                    {label}
                  </p>
                  <p className="mt-2 text-3xl font-black text-[#17202a]">
                    {value}
                  </p>
                  <p className="mt-2 text-sm leading-6 font-semibold text-[#474A4A]">
                    {description}
                  </p>
                </article>
              ))}
            </div>

            {stats.featuredMatch && (
              <article className="rounded-[1.75rem] border border-[#2A398D]/10 bg-[#071136] p-5 text-white shadow-[0_18px_60px_rgba(7,17,54,0.22)]">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="inline-flex items-center gap-2 text-[11px] font-black tracking-[0.18em] text-white/60 uppercase">
                      <CalendarClock className="h-4 w-4" aria-hidden />
                      {stats.featuredMatch.label}
                    </p>
                    <div className="w-fit rounded-full bg-white px-3 py-2 text-xs font-black text-[#2A398D] shadow-sm">
                      {formatDate(stats.featuredMatch.kickoffAt)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-5">
                    <div className="flex min-w-0 justify-end">
                      <FeaturedTeamFlag
                        team={stats.featuredMatch.homeTeam}
                        side="home"
                      />
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/65 ring-1 ring-white/10">
                      VS
                    </span>
                    <div className="flex min-w-0 justify-start">
                      <FeaturedTeamFlag
                        team={stats.featuredMatch.awayTeam}
                        side="away"
                      />
                    </div>
                  </div>

                  <p className="text-center text-sm font-semibold text-white/65">
                    {getRoundLabel(stats.featuredMatch.round)}
                    {stats.featuredMatch.stadiumCity
                      ? ` · ${stats.featuredMatch.stadiumCity}`
                      : ""}
                  </p>
                </div>
              </article>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

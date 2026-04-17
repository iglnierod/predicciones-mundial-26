"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  LoaderCircle,
  AlertCircle,
  CircleMinus,
  CircleCheck,
  CircleX,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Group, LeaderboardProfile } from "@/types";

type Props = {
  profile: LeaderboardProfile;
};

type GroupPredictionRow = {
  group_id: number;
  team_a_id: number | null;
  team_b_id: number | null;
};

type GroupPredictionSelection = Record<number, number[]>;

export default function GroupsTab({ profile }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [predictionSelection, setPredictionSelection] =
    useState<GroupPredictionSelection>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedGroupsCount = useMemo(() => {
    return Object.values(predictionSelection).filter(
      (teamIds) => teamIds.length > 0,
    ).length;
  }, [predictionSelection]);

  useEffect(() => {
    let isMounted = true;

    async function fetchGroupPredictions() {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        const [
          { data: groupsData, error: groupsError },
          { data: predictions, error: predictionsError },
        ] = await Promise.all([
          supabase
            .from("groups")
            .select(
              `
                id,
                name,
                qualified_team_a_id,
                qualified_team_b_id,
                teams!teams_group_id_fkey (
                  id,
                  name,
                  code,
                  flag_code,
                  group_id
                )
              `,
            )
            .order("name"),
          supabase
            .from("group_predictions")
            .select("group_id, team_a_id, team_b_id")
            .eq("user_id", profile.user_id),
        ]);

        if (groupsError) {
          throw new Error("No se pudieron cargar los grupos");
        }

        if (predictionsError) {
          throw new Error("No se pudieron cargar las predicciones del usuario");
        }

        const parsedGroups: Group[] = (groupsData ?? []).map((group) => ({
          ...group,
          teams: [...(group.teams ?? [])].sort((a, b) =>
            a.name.localeCompare(b.name, "es"),
          ),
        }));

        const parsedPredictionSelection = (
          predictions ?? []
        ).reduce<GroupPredictionSelection>(
          (acc, prediction: GroupPredictionRow) => {
            acc[prediction.group_id] = [
              prediction.team_a_id,
              prediction.team_b_id,
            ].filter((value): value is number => value !== null);
            return acc;
          },
          {},
        );

        if (!isMounted) return;

        setGroups(parsedGroups);
        setPredictionSelection(parsedPredictionSelection);
      } catch (err) {
        if (!isMounted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Se produjo un error al cargar las predicciones",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchGroupPredictions();

    return () => {
      isMounted = false;
    };
  }, [profile.user_id]);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
            FASE DE GRUPOS
          </span>

          <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold tracking-wide text-black/70">
            {profile.group_points} puntos
          </span>

          {!loading && !error && (
            <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold tracking-wide text-black/70">
              {selectedGroupsCount}/{groups.length} grupos predichos
            </span>
          )}
        </div>

        <h3 className="text-lg font-extrabold text-black">
          Desglose de grupos
        </h3>

        <p className="mt-2 text-sm leading-6 text-black/65">
          Aquí se muestran los dos equipos seleccionados por{" "}
          <span className="font-semibold text-black">
            {profile.full_name ?? "este usuario"}
          </span>{" "}
          en cada grupo.
        </p>
      </section>

      {loading ? (
        <GroupsTabSkeleton />
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">No se pudieron cargar los grupos</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {groups.map((group) => (
            <GroupPredictionCard
              key={group.id}
              group={group}
              selectedTeamIds={predictionSelection[group.id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupPredictionCard({
  group,
  selectedTeamIds,
}: {
  group: Group;
  selectedTeamIds: number[];
}) {
  const hasQualifiedResults =
    group.qualified_team_a_id !== null && group.qualified_team_b_id !== null;

  return (
    <article className="rounded-3xl border border-black/5 bg-white/85 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
          GRUPO {group.name}
        </span>
      </div>

      <div className="space-y-1.5">
        {group.teams?.map((team) => {
          const isSelected = selectedTeamIds.includes(team.id);
          const isQualified =
            team.id === group.qualified_team_a_id ||
            team.id === group.qualified_team_b_id;

          return (
            <div
              key={team.id}
              className={
                isSelected
                  ? "flex items-center gap-3 rounded-2xl border border-[#2A398D]/15 bg-[#2A398D]/10 px-3 py-2.5 shadow-sm"
                  : "flex items-center gap-3 rounded-2xl border border-black/5 bg-black/3 px-3 py-2.5"
              }
            >
              <div
                className={
                  isSelected
                    ? "overflow-hidden rounded-tr-xl rounded-bl-xl border border-[#2A398D]/15 bg-white shadow-sm"
                    : "overflow-hidden rounded-tr-xl rounded-bl-xl border border-black/5 bg-white shadow-sm"
                }
              >
                <Image
                  src={`https://flagcdn.com/w160/${team.flag_code}.png`}
                  alt={`Bandera de ${team.name}`}
                  width={48}
                  height={32}
                  className="aspect-auto h-8 w-12 object-cover"
                  title={team.name}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={
                    isSelected
                      ? "text-sm font-semibold text-black"
                      : "text-sm text-black/80"
                  }
                  title={team.name}
                >
                  {team.code}
                </p>
              </div>

              {isSelected && (
                <PredictionStatusIcon
                  hasQualifiedResults={hasQualifiedResults}
                  isQualified={isQualified}
                />
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function PredictionStatusIcon({
  hasQualifiedResults,
  isQualified,
}: {
  hasQualifiedResults: boolean;
  isQualified: boolean;
}) {
  if (!hasQualifiedResults) {
    return <CircleMinus className="h-5 w-5 shrink-0 text-black/35" />;
  }

  if (isQualified) {
    return <CircleCheck className="h-5 w-5 shrink-0 text-green-600" />;
  }

  return <CircleX className="h-5 w-5 shrink-0 text-red-500" />;
}

function GroupsTabSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-black/5 bg-white/85 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="h-6 w-20 animate-pulse rounded-full bg-[#2A398D]/10" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: 4 }).map((__, teamIndex) => (
              <div
                key={teamIndex}
                className="flex animate-pulse items-center gap-3 rounded-2xl border border-black/5 bg-black/3 px-3 py-2.5"
              >
                <div className="h-8 w-12 rounded bg-black/5" />
                <div className="flex-1">
                  <div className="h-4 w-16 rounded bg-black/5" />
                </div>
                <div className="h-5 w-5 rounded-full bg-black/5" />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="sr-only">
        <LoaderCircle className="h-4 w-4 animate-spin" />
      </div>
    </div>
  );
}

"use server";

import {
  areTournamentPredictionsClosed,
  getTournamentPredictionsCloseAt,
} from "@/lib/predictions/tournament-deadline";
import { createClient } from "@/lib/supabase/server";
import type {
  Group,
  GroupPredictionSelection,
  MatchPrediction,
  MatchPredictionBreakdown,
  MatchPredictionOverview,
  MatchWithTeam,
} from "@/types";

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

type GroupPredictionRow = {
  group_id: number;
  team_a_id: number | null;
  team_b_id: number | null;
};

function getSingleRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function loadLeaderboardGroupBreakdown(profileUserId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      groups: [] as Group[],
      predictionSelection: {} as GroupPredictionSelection,
      error: "Debes iniciar sesión para ver estas predicciones.",
    };
  }

  const closeAt = await getTournamentPredictionsCloseAt(supabase);
  const canViewOtherUserPredictions = areTournamentPredictionsClosed(closeAt);

  if (user.id !== profileUserId && !canViewOtherUserPredictions) {
    return {
      success: false,
      groups: [] as Group[],
      predictionSelection: {} as GroupPredictionSelection,
      error:
        "Las predicciones de otros usuarios estarán disponibles al cierre.",
    };
  }

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
      .eq("user_id", profileUserId),
  ]);

  if (groupsError) {
    return {
      success: false,
      groups: [] as Group[],
      predictionSelection: {} as GroupPredictionSelection,
      error: "No se pudieron cargar los grupos.",
    };
  }

  if (predictionsError) {
    return {
      success: false,
      groups: [] as Group[],
      predictionSelection: {} as GroupPredictionSelection,
      error: "No se pudieron cargar las predicciones del usuario.",
    };
  }

  const groups: Group[] = (groupsData ?? []).map((group) => ({
    ...group,
    teams: [...(group.teams ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, "es"),
    ),
  }));

  const predictionSelection = (predictions ?? []).reduce<GroupPredictionSelection>(
    (acc, prediction: GroupPredictionRow) => {
      acc[prediction.group_id] = [
        prediction.team_a_id,
        prediction.team_b_id,
      ].filter((value): value is number => value !== null);
      return acc;
    },
    {},
  );

  return {
    success: true,
    groups,
    predictionSelection,
    error: null,
  };
}

export async function loadLeaderboardMatchBreakdown(
  profileUserId: string,
  pageToLoad: number,
  pageSize: number,
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      items: [],
      hasMore: false,
      error: "Debes iniciar sesión para comparar predicciones por partido.",
    };
  }

  const safePage = Math.max(0, pageToLoad);
  const safePageSize = Math.max(1, Math.min(pageSize, 50));
  const from = safePage * safePageSize;
  const to = from + safePageSize - 1;
  const isOwnProfile = user.id === profileUserId;

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
    return {
      success: false,
      items: [],
      hasMore: false,
      error: "No se pudieron cargar los partidos.",
    };
  }

  const rawMatches = (matchesData ?? []) as MatchRowQuery[];
  const matches: MatchWithTeam[] = rawMatches.map((match) => {
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

  const matchIds = matches.map((match) => match.id);
  const userIds = isOwnProfile ? [profileUserId] : [profileUserId, user.id];
  let predictionMap = new Map<string, MatchPredictionWithMeta>();

  if (matchIds.length > 0) {
    const { data: predictionsData, error: predictionsError } = await supabase
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
      return {
        success: false,
        items: [],
        hasMore: false,
        error: "No se pudieron cargar las predicciones.",
      };
    }

    const typedPredictions = (predictionsData ?? []) as MatchPredictionOverview[];

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

  const items = matches.map((match) => ({
    match,
    viewerPrediction: predictionMap.get(`${match.id}-${user.id}`) ?? null,
    profilePrediction: predictionMap.get(`${match.id}-${profileUserId}`) ?? null,
  }));

  return {
    success: true,
    items,
    hasMore: matches.length === safePageSize,
    error: null,
  };
}

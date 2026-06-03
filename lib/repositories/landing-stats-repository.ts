import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CountResult = {
  count: number | null;
  error: { message: string } | null;
};

type MatchTimingRow = {
  kickoff_at: string;
};

type MatchRow = {
  id: number;
  round: string;
  kickoff_at: string;
  status: string;
  home_team_id: number | null;
  away_team_id: number | null;
  stadium_city: string | null;
};

type TeamRow = {
  id: number;
  name: string;
  code: string;
  flag_code: string | null;
};

type FeaturedTeam = {
  name: string;
  code: string;
  flagCode: string | null;
};

export type LandingStats = {
  firstKickoffAt: string | null;
  lastKickoffAt: string | null;
  totalMatches: number;
  completedMatches: number;
  scheduledMatches: number;
  liveMatches: number;
  totalPredictions: number;
  totalUsers: number;
  featuredMatch: {
    label: string;
    round: string;
    kickoffAt: string;
    status: string;
    homeTeam: FeaturedTeam;
    awayTeam: FeaturedTeam;
    stadiumCity: string | null;
  } | null;
};

const emptyLandingStats: LandingStats = {
  firstKickoffAt: null,
  lastKickoffAt: null,
  totalMatches: 0,
  completedMatches: 0,
  scheduledMatches: 0,
  liveMatches: 0,
  totalPredictions: 0,
  totalUsers: 0,
  featuredMatch: null,
};

function getCount(result: CountResult) {
  if (result.error) {
    console.error(`No se pudo cargar una estadística: ${result.error.message}`);
  }

  return result.count ?? 0;
}

function getSettledCount(result: PromiseSettledResult<CountResult>) {
  if (result.status === "rejected") {
    console.error("No se pudo cargar una estadística:", result.reason);
    return 0;
  }

  return getCount(result.value);
}

async function getFeaturedMatch(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
) {
  const now = new Date().toISOString();

  const upcomingResult = await supabase
    .from("matches")
    .select(
      "id, round, kickoff_at, status, home_team_id, away_team_id, stadium_city",
    )
    .in("status", ["scheduled", "live"])
    .gte("kickoff_at", now)
    .order("kickoff_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let match = upcomingResult.data as MatchRow | null;
  let label = "Próximo partido";

  if (upcomingResult.error) {
    console.error(
      `No se pudo cargar el próximo partido: ${upcomingResult.error.message}`,
    );
  }

  if (!match) {
    const latestResult = await supabase
      .from("matches")
      .select(
        "id, round, kickoff_at, status, home_team_id, away_team_id, stadium_city",
      )
      .order("kickoff_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestResult.error) {
      console.error(
        `No se pudo cargar el último partido: ${latestResult.error.message}`,
      );
    }

    match = latestResult.data as MatchRow | null;
    label = "Último partido registrado";
  }

  if (!match) return null;

  const teamIds = [match.home_team_id, match.away_team_id].filter(
    (teamId): teamId is number => typeof teamId === "number",
  );

  const teamsById = new Map<number, TeamRow>();

  if (teamIds.length > 0) {
    const { data: teams, error } = await supabase
      .from("teams")
      .select("id, name, code, flag_code")
      .in("id", teamIds);

    if (error) {
      console.error(`No se pudieron cargar los equipos: ${error.message}`);
    }

    ((teams ?? []) as TeamRow[]).forEach((team) => {
      teamsById.set(team.id, team);
    });
  }

  const homeTeam = match.home_team_id
    ? teamsById.get(match.home_team_id)
    : null;
  const awayTeam = match.away_team_id
    ? teamsById.get(match.away_team_id)
    : null;

  return {
    label,
    round: match.round,
    kickoffAt: match.kickoff_at,
    status: match.status,
    homeTeam: {
      name: homeTeam?.name ?? "Por definir",
      code: homeTeam?.code ?? "TBD",
      flagCode: homeTeam?.flag_code ?? null,
    },
    awayTeam: {
      name: awayTeam?.name ?? "Por definir",
      code: awayTeam?.code ?? "TBD",
      flagCode: awayTeam?.flag_code ?? null,
    },
    stadiumCity: match.stadium_city,
  };
}

export async function getLandingStats(): Promise<LandingStats> {
  try {
    const supabase = createSupabaseAdminClient();

    const [
      firstMatchResult,
      lastMatchResult,
      totalMatchesResult,
      completedMatchesResult,
      scheduledMatchesResult,
      liveMatchesResult,
      matchPredictionsResult,
      groupPredictionsResult,
      tournamentPredictionsResult,
      totalUsersResult,
      featuredMatch,
    ] = await Promise.all([
      supabase
        .from("matches")
        .select("kickoff_at")
        .order("kickoff_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("matches")
        .select("kickoff_at")
        .order("kickoff_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("matches").select("id", { count: "exact", head: true }),
      supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
      supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("status", "scheduled"),
      supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("status", "live"),
      supabase
        .from("match_predictions")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("group_predictions")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("tournament_predictions")
        .select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      getFeaturedMatch(supabase),
    ]);

    if (firstMatchResult.error) {
      console.error(
        `No se pudo cargar el inicio del torneo: ${firstMatchResult.error.message}`,
      );
    }

    if (lastMatchResult.error) {
      console.error(
        `No se pudo cargar el final del torneo: ${lastMatchResult.error.message}`,
      );
    }

    const predictionCounts = await Promise.allSettled([
      Promise.resolve(matchPredictionsResult as CountResult),
      Promise.resolve(groupPredictionsResult as CountResult),
      Promise.resolve(tournamentPredictionsResult as CountResult),
    ]);

    return {
      firstKickoffAt:
        (firstMatchResult.data as MatchTimingRow | null)?.kickoff_at ?? null,
      lastKickoffAt:
        (lastMatchResult.data as MatchTimingRow | null)?.kickoff_at ?? null,
      totalMatches: getCount(totalMatchesResult as CountResult),
      completedMatches: getCount(completedMatchesResult as CountResult),
      scheduledMatches: getCount(scheduledMatchesResult as CountResult),
      liveMatches: getCount(liveMatchesResult as CountResult),
      totalPredictions: predictionCounts.reduce(
        (total, result) => total + getSettledCount(result),
        0,
      ),
      totalUsers: getCount(totalUsersResult as CountResult),
      featuredMatch,
    };
  } catch (error) {
    console.error(
      "No se pudieron cargar las estadísticas de la landing:",
      error,
    );
    return emptyLandingStats;
  }
}

import { SupabaseClient } from "@supabase/supabase-js";
import type { ApiMatch } from "@/types";

type GroupRow = {
  id: number;
  name: string;
};

type MatchInsertRow = {
  api_match_id: number;
  match_number: number;
  round: string;
  group_id: number | null;
  home_team_id: number | null;
  away_team_id: number | null;
  stadium: string | null;
  stadium_city: string | null;
  stadium_country: string | null;
  kickoff_at: string;
  status: "scheduled" | "live" | "completed";
  home_score: number | null;
  away_score: number | null;
};

function normalizeStatus(status: string): "scheduled" | "live" | "completed" {
  if (status === "scheduled") return "scheduled";
  if (status === "live") return "live";
  if (status === "completed") return "completed";

  return "scheduled";
}

function normalizeGroupName(groupName: string | null): string | null {
  if (!groupName) return null;
  return groupName.trim().toUpperCase();
}

async function getGroupsByName(supabase: SupabaseClient) {
  const { data: groups, error } = await supabase
    .from("groups")
    .select("id, name");

  if (error) {
    throw new Error(`Failed to load groups: ${error.message}`);
  }

  return new Map<string, number>(
    ((groups ?? []) as GroupRow[]).map((group) => [
      group.name.trim().toUpperCase(),
      group.id,
    ]),
  );
}

function mapApiMatchToMatchRow(
  match: ApiMatch,
  groupsByName: Map<string, number>,
): MatchInsertRow {
  const normalizedGroupName = normalizeGroupName(match.group_name ?? null);

  return {
    api_match_id: match.id,
    match_number: match.match_number,
    round: match.round,
    group_id: normalizedGroupName
      ? (groupsByName.get(normalizedGroupName) ?? null)
      : null,
    home_team_id: match.home_team_id,
    away_team_id: match.away_team_id,
    stadium: match.stadium,
    stadium_city: match.stadium_city,
    stadium_country: match.stadium_country,
    kickoff_at: match.kickoff_utc,
    status: normalizeStatus(match.status),
    home_score: match.home_score,
    away_score: match.away_score,
  };
}

export async function upsertMatchesFromApi(
  supabase: SupabaseClient,
  apiMatches: ApiMatch[],
) {
  const groupsByName = await getGroupsByName(supabase);

  const rows = apiMatches.map((match) =>
    mapApiMatchToMatchRow(match, groupsByName),
  );

  const { error } = await supabase.from("matches").upsert(rows, {
    onConflict: "api_match_id",
  });

  if (error) {
    throw new Error(`Failed to upsert matches: ${error.message}`);
  }

  return {
    insertedOrUpdated: rows.length,
  };
}

export async function upsertSingleMatchFromApi(
  supabase: SupabaseClient,
  apiMatch: ApiMatch,
) {
  const groupsByName = await getGroupsByName(supabase);

  const row = mapApiMatchToMatchRow(apiMatch, groupsByName);

  const { data, error } = await supabase
    .from("matches")
    .upsert(row, {
      onConflict: "api_match_id",
    })
    .select("id, api_match_id, match_number, home_score, away_score, status")
    .single();

  if (error) {
    throw new Error(`Failed to upsert match: ${error.message}`);
  }

  return data;
}

export async function getMatchApiIdByInternalId(
  supabase: SupabaseClient,
  matchId: number,
) {
  const { data, error } = await supabase
    .from("matches")
    .select("id, api_match_id")
    .eq("id", matchId)
    .single();

  if (error) {
    throw new Error(`Failed to load match ${matchId}: ${error.message}`);
  }

  if (!data?.api_match_id) {
    throw new Error(`Match ${matchId} does not have api_match_id`);
  }

  return data.api_match_id as number;
}

export async function getMatchById(supabase: SupabaseClient, matchId: number) {
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
      id,
      api_match_id,
      match_number,
      round,
      kickoff_at,
      status,
      home_score,
      away_score,
      home_team_id,
      away_team_id,
      last_processed_key,
      points_calculated_at
    `,
    )
    .eq("id", matchId)
    .single();

  if (error) {
    throw new Error(`Error loading match ${matchId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Match ${matchId} not found`);
  }

  return data;
}

export async function markMatchPointsCalculated(
  supabase: SupabaseClient,
  matchId: number,
  processedKey: string,
) {
  const { error } = await supabase
    .from("matches")
    .update({
      last_processed_key: processedKey,
      points_calculated_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  if (error) {
    throw new Error(
      `Error marking match ${matchId} as calculated: ${error.message}`,
    );
  }
}

import { createClient } from "@supabase/supabase-js";
import type { ApiMatch } from "@/types";
import { RouteKind } from "next/dist/server/route-kind";

type GroupRow = {
  id: number;
  name: string;
};

type Round = {
  name: "group" | "R32" | "R16" | "QF" | "SF" | "3rd" | "final";
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

export async function syncMatchesFromApi(): Promise<{
  insertedOrUpdated: number;
}> {
  const wcApiUrl = process.env.WC26_API_URL;
  const wcApiKey = process.env.WC26_API_KEY;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!wcApiUrl || !wcApiKey) {
    throw new Error("Missing WC 26 API URL & KEY");
  }

  if (!supabaseUrl || !secretKey) {
    throw new Error("Missing supabaseUrl and publishable key");
  }

  const supabase = createClient(supabaseUrl, secretKey);

  const round: Round = { name: "group" };

  const apiResponse = await fetch(`${wcApiUrl}/matches?round=${round.name}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${wcApiKey}`,
    },
    cache: "no-store",
  });

  if (!apiResponse.ok) {
    throw new Error(
      `Failed to fetch matches from API: ${apiResponse.status} ${apiResponse.statusText}`,
    );
  }

  const apiMatches = (await apiResponse.json()) as ApiMatch[];

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id, name");

  if (groupsError) {
    throw new Error(`Failed to load groups: ${groupsError.message}`);
  }

  const groupsByName = new Map<string, number>(
    (groups satisfies GroupRow[]).map((group) => [
      group.name.trim().toUpperCase(),
      group.id,
    ]),
  );

  const rows: MatchInsertRow[] = apiMatches.map((match) => ({
    api_match_id: match.id,
    match_number: match.match_number,
    round: match.round,
    group_id: match.group_name
      ? (groupsByName.get(match.group_name) ?? null)
      : null,
    home_team_id: match.home_team_id,
    away_team_id: match.away_team_id,
    stadium: match.stadium,
    stadium_city: match.stadium_city,
    stadium_country: match.stadium_country,
    kickoff_at: match.kickoff_utc,
    status: match.status,
    home_score: match.home_score,
    away_score: match.away_score,
  }));

  const { error: upsertError } = await supabase.from("matches").upsert(rows, {
    onConflict: "api_match_id",
  });

  if (upsertError) {
    throw new Error(`Failed to upsert matches: ${upsertError.message}`);
  }

  return {
    insertedOrUpdated: rows.length,
  };
}

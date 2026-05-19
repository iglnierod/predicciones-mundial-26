import { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchWc2026MatchByApiId,
  fetchWc2026Matches,
} from "../external/wc2026-api";
import {
  getMatchApiIdByInternalId,
  upsertMatchesFromApi,
  upsertSingleMatchFromApi,
} from "../repositories/matches-repository";

export async function syncMatchesFromApi(supabase: SupabaseClient) {
  const apiMatches = await fetchWc2026Matches();

  const result = await upsertMatchesFromApi(supabase, apiMatches);

  return {
    insertedOrUpdated: result.insertedOrUpdated,
  };
}

export async function syncSingleMatchFromApi(
  supabase: SupabaseClient,
  matchId: number,
) {
  const apiMatchId = await getMatchApiIdByInternalId(supabase, matchId);

  const apiMatch = await fetchWc2026MatchByApiId(apiMatchId);

  const updatedMatch = await upsertSingleMatchFromApi(supabase, apiMatch);

  return {
    matchId: updatedMatch.id,
    apiMatchId: updatedMatch.api_match_id,
    matchNumber: updatedMatch.match_number,
    status: updatedMatch.status,
    homeScore: updatedMatch.home_score,
    awayScore: updatedMatch.away_score,
  };
}

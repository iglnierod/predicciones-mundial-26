import { SupabaseClient } from "@supabase/supabase-js";

export async function getMatchById(supabase: SupabaseClient, matchId: number) {
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select(
      "id, status, home_score, away_score, last_processed_key, points_calculated_at",
    )
    .eq("id", matchId)
    .single();

  if (matchError) {
    throw new Error(`Error loading match ${matchId}: ${matchError.message}`);
  }

  return match;
}

export async function markMatchPointsCalculated(params: {
  supabase: SupabaseClient;
  matchId: number;
  processedKey: string;
}) {
  const { supabase, matchId, processedKey } = params;

  const { error } = await supabase
    .from("matches")
    .update({
      last_processed_key: processedKey,
      points_calculated_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  if (error) {
    throw new Error(`Error updating match ${matchId}: ${error.message}`);
  }
}

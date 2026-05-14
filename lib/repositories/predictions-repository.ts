import { SupabaseClient } from "@supabase/supabase-js";

export async function getMatchPredictions(
  supabase: SupabaseClient,
  matchId: number,
) {
  const { data: matchPredictions, error: matchPredictionsError } =
    await supabase
      .from("match_predictions")
      .select(
        "id, user_id, match_id, predicted_home_score, predicted_away_score",
      )
      .eq("match_id", matchId);

  if (matchPredictionsError) {
    throw new Error(
      `Error loading predictions for match ${matchId}: ${matchPredictionsError.message}`,
    );
  }

  return matchPredictions ?? [];
}

export async function deleteMatchPredictionPoints(
  supabase: SupabaseClient,
  matchId: number,
) {
  const { data: affectedRows, error: selectError } = await supabase
    .from("prediction_points")
    .select("user_id")
    .eq("prediction_type", "match")
    .eq("match_id", matchId);

  if (selectError) {
    throw new Error(
      `Error loading affected users for match ${matchId}: ${selectError.message}`,
    );
  }

  const affectedUserIds = [
    ...new Set((affectedRows ?? []).map((row) => row.user_id)),
  ];

  const { error: deleteError } = await supabase
    .from("prediction_points")
    .delete()
    .eq("prediction_type", "match")
    .eq("match_id", matchId);

  if (deleteError) {
    throw new Error(
      `Error deleting prediction points for match ${matchId}: ${deleteError.message}`,
    );
  }

  return {
    deletedPoints: affectedRows?.length ?? 0,
    affectedUserIds,
  };
}

export async function insertPredictionPointsRow(
  supabase: SupabaseClient,
  rows: Array<{
    user_id: string;
    prediction_type: "match";
    prediction_id: number;
    match_id: number;
    points: number;
    breakdown: Record<string, unknown>;
  }>,
) {
  if (rows.length === 0) return;

  const { error } = await supabase.from("prediction_points").insert(rows);

  if (error) {
    throw new Error(`Error inserting prediction points: ${error.message}`);
  }
}

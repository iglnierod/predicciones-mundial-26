import { SupabaseClient } from "@supabase/supabase-js";

export async function recalculateUserPoints(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data: predictionPoints, error: predictionPointsError } =
    await supabase
      .from("prediction_points")
      .select("prediction_type, points")
      .eq("user_id", userId);

  if (predictionPointsError) {
    throw new Error(
      `Error loading prediction points for user ${userId}: ${predictionPointsError.message}`,
    );
  }

  let groupPoints = 0;
  let matchPoints = 0;
  let extraPoints = 0;
  let tournamentPoints = 0;

  predictionPoints.map((row) => {
    if (row.prediction_type === "group") groupPoints += row.points;
    if (row.prediction_type === "match") matchPoints += row.points;
    if (row.prediction_type === "match_extra") extraPoints += row.points;
    if (row.prediction_type === "tournament") tournamentPoints += row.points;
  });

  const totalPoints =
    groupPoints + matchPoints + extraPoints + tournamentPoints;

  const { error: upsertError } = await supabase.from("user_points").upsert(
    {
      user_id: userId,
      group_points: groupPoints,
      match_points: matchPoints,
      extra_points: extraPoints,
      tournament_points: tournamentPoints,
      total_points: totalPoints,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    },
  );

  if (upsertError) {
    throw new Error(
      `Error updating user_points for user ${userId}: ${upsertError.message}`,
    );
  }
}

export async function deleteSingleGroupPredictionPoints(
  supabase: SupabaseClient,
  groupId: number,
) {
  const { data: affectedRows, error: selectError } = await supabase
    .from("prediction_points")
    .select("user_id")
    .eq("prediction_type", "group")
    .eq("group_id", groupId);

  if (selectError) {
    throw new Error(
      `No se pudieron cargar los puntos afectados del grupo ${groupId}: ${selectError.message}`,
    );
  }

  const affectedUserIds = [
    ...new Set((affectedRows ?? []).map((row) => row.user_id)),
  ];

  const { error: deleteError } = await supabase
    .from("prediction_points")
    .delete()
    .eq("prediction_type", "group")
    .eq("group_id", groupId);

  if (deleteError) {
    throw new Error(
      `No se pudieron eliminar los puntos del grupo ${groupId}: ${deleteError.message}`,
    );
  }

  return {
    deletedPoints: affectedRows?.length ?? 0,
    affectedUserIds,
  };
}

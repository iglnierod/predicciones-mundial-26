import { SupabaseClient } from "@supabase/supabase-js";
import { getGroupWithQualifiedTeamsById } from "@/lib/repositories/groups-repository";
import { getGroupPredictionsByGroupId } from "@/lib/repositories/group-predictions-repository";
import {
  deleteSingleGroupPredictionPoints,
  recalculateUserPoints,
  upsertGroupPredictionPoint,
} from "@/lib/repositories/user-points-repository";
import { createLeaderboardSnapshot } from "@/lib/repositories/leaderboard-snapshots-repository";
import { calculateSingleGroupPredictionPoints } from "@/lib/scoring/group-points";
import { getScoringRulesMap } from "@/lib/scoring/rules";

export async function calculateSingleGroupPoints(
  supabase: SupabaseClient,
  groupId: number,
) {
  const group = await getGroupWithQualifiedTeamsById(supabase, groupId);
  const rulesMap = await getScoringRulesMap(supabase);

  const previousPoints = await deleteSingleGroupPredictionPoints(
    supabase,
    groupId,
  );

  const predictions = await getGroupPredictionsByGroupId(supabase, groupId);

  const affectedUserIds = new Set<string>(previousPoints.affectedUserIds);

  let calculatedPredictions = 0;
  let totalAwardedPoints = 0;

  for (const prediction of predictions) {
    const scoring = calculateSingleGroupPredictionPoints(
      {
        groupId: group.id,
        qualifiedTeamAId: group.qualified_team_a_id,
        qualifiedTeamBId: group.qualified_team_b_id,
      },
      prediction,
      rulesMap,
    );

    await upsertGroupPredictionPoint(supabase, {
      userId: prediction.user_id,
      predictionId: prediction.id,
      groupId: prediction.group_id,
      points: scoring.points,
      breakdown: scoring.breakdown,
    });

    affectedUserIds.add(prediction.user_id);
    calculatedPredictions++;
    totalAwardedPoints += scoring.points;
  }

  for (const userId of affectedUserIds) {
    await recalculateUserPoints(supabase, userId);
  }

  const leaderboardSnapshot = await createLeaderboardSnapshot(supabase, {
    sourceType: "group",
    sourceId: groupId,
  });

  return {
    groupId: group.id,
    groupName: group.name,
    deletedPreviousPoints: previousPoints.deletedPoints,
    calculatedPredictions,
    totalAwardedPoints,
    recalculatedUsers: affectedUserIds.size,
    leaderboardSnapshot,
  };
}

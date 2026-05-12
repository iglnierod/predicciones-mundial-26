import { GroupPredictionRow } from "../repositories/group-predictions-repository";

export type GroupResultForScoring = {
  groupId: number;
  qualifiedTeamAId: number;
  qualifiedTeamBId: number;
};

export type GroupPredictionScoringResult = {
  points: number;
  breakdown: {
    matchedTeams: number;
    matchedTeamIds: number[];
    bonusBothTeams: boolean;
    maxPoints: number;
  };
};

const POINTS_PER_CORRECT_TEAM = 2;
const BONUS_BOTH_TEAMS = 1;
const MAX_GROUP_POINTS = 5;

export function calculateSingleGroupPredictionPoints(
  result: GroupResultForScoring,
  prediction: GroupPredictionRow,
): GroupPredictionScoringResult {
  const predictedTeamIds = [prediction.team_a_id, prediction.team_b_id].filter(
    (teamId): teamId is number => typeof teamId === "number",
  );

  const realQualifiedTeamIds = [
    result.qualifiedTeamAId,
    result.qualifiedTeamBId,
  ];

  if (predictedTeamIds.length < 2) {
    return {
      points: 0,
      breakdown: {
        matchedTeams: 0,
        matchedTeamIds: [],
        bonusBothTeams: false,
        maxPoints: MAX_GROUP_POINTS,
      },
    };
  }

  const uniquePredictedTeamIds = [...new Set(predictedTeamIds)];

  const matchedTeamIds = uniquePredictedTeamIds.filter((teamId) =>
    realQualifiedTeamIds.includes(teamId),
  );

  const matchedTeams = matchedTeamIds.length;
  const bonusBothTeams = matchedTeams === 2;

  const points =
    matchedTeams * POINTS_PER_CORRECT_TEAM +
    (bonusBothTeams ? BONUS_BOTH_TEAMS : 0);

  return {
    points: points,
    breakdown: {
      matchedTeams,
      matchedTeamIds,
      bonusBothTeams,
      maxPoints: MAX_GROUP_POINTS,
    },
  };
}

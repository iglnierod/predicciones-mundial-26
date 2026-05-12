import { GroupPredictionRow } from "../repositories/group-predictions-repository";
import { ScoringRulesMap } from "./types";

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
    pointsPerCorrectTeam: number;
    bonusBothTeamsPoints: number;
    maxPoints: number;
  };
};

const GROUP_CORRECT_TEAM_RULE_KEY = "group_team_correct";
const GROUP_BOTH_TEAMS_BONUS_RULE_KEY = "group_bonus_both";

function getRequiredRulePoints(
  rulesMap: ScoringRulesMap,
  ruleKey: string,
): number {
  const points = rulesMap[ruleKey];

  if (typeof points !== "number") {
    throw new Error(`No se encontró la regla de puntuación: ${ruleKey}`);
  }

  return points;
}

export function calculateSingleGroupPredictionPoints(
  result: GroupResultForScoring,
  prediction: GroupPredictionRow,
  rulesMap: ScoringRulesMap,
): GroupPredictionScoringResult {
  const pointsPerCorrectTeam = getRequiredRulePoints(
    rulesMap,
    GROUP_CORRECT_TEAM_RULE_KEY,
  );

  const bonusBothTeamsPoints = getRequiredRulePoints(
    rulesMap,
    GROUP_BOTH_TEAMS_BONUS_RULE_KEY,
  );

  const maxPoints = pointsPerCorrectTeam * 2 + bonusBothTeamsPoints;

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
        pointsPerCorrectTeam,
        bonusBothTeamsPoints,
        maxPoints,
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
    matchedTeams * pointsPerCorrectTeam +
    (bonusBothTeams ? bonusBothTeamsPoints : 0);

  return {
    points,
    breakdown: {
      matchedTeams,
      matchedTeamIds,
      bonusBothTeams,
      pointsPerCorrectTeam,
      bonusBothTeamsPoints,
      maxPoints,
    },
  };
}

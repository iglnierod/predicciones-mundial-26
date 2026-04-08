import {
  MatchPredictionPointsResult,
  MatchResultType,
  ScoringRulesMap,
} from "./types";

function getResultType(home: number, away: number): MatchResultType {
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
}

export function buildProcessedKey(
  homeScore: number,
  awayScore: number,
): string {
  return `completed-${homeScore}-${awayScore}`;
}

export function calculateStandardMatchPredictionPoints(params: {
  realHomeScore: number;
  realAwayScore: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
  scoringRules: ScoringRulesMap;
}): MatchPredictionPointsResult {
  const {
    realHomeScore,
    realAwayScore,
    predictedHomeScore,
    predictedAwayScore,
    scoringRules,
  } = params;

  const realResult = getResultType(realHomeScore, realAwayScore);
  const predictedResult = getResultType(predictedHomeScore, predictedAwayScore);

  const realDifference = realHomeScore - realAwayScore;
  const predictedDifference = predictedHomeScore - predictedAwayScore;

  let ruleKey: MatchPredictionPointsResult["ruleKey"] = "no_points";
  let points = 0;

  if (
    predictedHomeScore === realHomeScore &&
    predictedAwayScore === realAwayScore
  ) {
    ruleKey = "match_exact_score";
    points = scoringRules[ruleKey] ?? 0;
  } else if (
    (realResult === "draw" && predictedResult === "draw") ||
    (realResult === predictedResult && realDifference === predictedDifference)
  ) {
    ruleKey = "match_winner_and_difference";
    points = scoringRules[ruleKey] ?? 0;
  } else if (realResult === predictedResult) {
    ruleKey = "match_winner_only";
    points = scoringRules[ruleKey] ?? 0;
  } else if (
    predictedHomeScore === realHomeScore ||
    predictedAwayScore === realAwayScore
  ) {
    ruleKey = "match_one_team_goals";
    points = scoringRules[ruleKey] ?? 0;
  }

  return {
    points,
    ruleKey,
    breakdown: {
      predictedHomeScore,
      predictedAwayScore,
      realHomeScore,
      realAwayScore,
      predictedResult,
      realResult,
      predictedDifference,
      realDifference,
      ruleKey,
      points,
    },
  };
}

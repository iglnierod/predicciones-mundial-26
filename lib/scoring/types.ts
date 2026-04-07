export type MatchResultType = "home" | "away" | "draw";

export type MatchScoringRuleKey =
  | "match_exact_score"
  | "match_winner_and_difference"
  | "match_winner_only"
  | "match_one_team_goals"
  | "no_points";

export type ScoringRulesMap = Record<string, number>;

export type MatchRow = {
  id: number;
  status: "scheduled" | "live" | "completed";
  home_score: number | null;
  away_score: number | null;
  last_processed_key: string | null;
  points_calculated_at: string | null;
};

export type MatchPredictionRow = {
  id: number;
  user_id: string;
  match_id: number;
  predicted_home_score: number;
  predicted_away_score: number;
};

export type MatchPredictionPointsResult = {
  points: number;
  ruleKey: MatchScoringRuleKey;
  breakdown: Record<string, unknown>;
};

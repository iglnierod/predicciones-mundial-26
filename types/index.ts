export interface Team {
  id: number;
  name: string;
  code: string;
  flag_code: string;
  group_id: number;
  is_top10_ranking_fifa?: boolean;
}

export interface Group {
  id: number;
  name: string;
  teams?: Team[];
}

export type GroupPredictionSelection = Record<string, number[]>;

export interface Leaderboard {
  user_id: string;
  full_name: string;
  avatar_url: string;
  group_points: number;
  match_points: number;
  extra_points: number;
  tournament_points: number;
  total_points: number;
  rank: number;
  updated_at?: string; // Hace falta? Es el tipo de dato?
}

export type ApiMatch = {
  id: number;
  match_number: number;
  round: string;
  group_name: string | null;
  home_team_id: number | null;
  home_team: string | null;
  home_team_code: string | null;
  home_team_flag: string | null;
  away_team_id: number | null;
  away_team: string | null;
  away_team_code: string | null;
  away_team_flag: string | null;
  stadium_id: number | null;
  stadium: string | null;
  stadium_city: string | null;
  stadium_country: string | null;
  kickoff_utc: string;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "live" | "completed";
};

export type MatchWithTeam = {
  id: number;
  round: string;
  kickoff_at: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  stadium: string | null;
  stadium_city: string | null;
  stadium_country: string | null;
  group_name: string | null;
  home_team_name: string;
  home_team_code: string;
  home_team_flag_code: string;
  away_team_name: string;
  away_team_code: string;
  away_team_flag_code: string;
};

export type MatchPrediction = {
  user_id: string;
  match_id: number;
  predicted_home_score: number;
  predicted_away_score: number;
};

export type MatchWithPrediction = {
  id: number;
  api_match_id: number | null;
  match_number: number | null;
  round: string;
  kickoff_at: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  stadium: string | null;
  stadium_city: string | null;
  stadium_country: string | null;
  group_id: number | null;
  group_name: string | null;
  home_team_id: number;
  home_team_name: string;
  home_team_code: string;
  home_team_flag_code: string;
  away_team_id: number;
  away_team_name: string;
  away_team_code: string;
  away_team_flag_code: string;

  prediction_id: number | null;
  prediction_user_id: string | null;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
  prediction_created_at: string | null;
  prediction_updated_at: string | null;
};

export type TournamentPrediction = {
  id: number;
  user_id: string;
  world_cup_winner_team_id: number | null;
  top_scorer: string | null;
  top_assist: string | null;
  hat_trick_player: string | null;
  most_goals_in_a_match_team_id: number | null;
  how_many_penalty_shootouts: string | null;
  underdog_quarterfinal_team_id: number | null;
  spain_top_scorer: string | null;
  spain_top_assist: string | null;
  spain_red_card_player: string | null;
  spain_round: string | null;
  spain_total_goals: string | null;
};

export type TournamentPredictionFormValues = {
  world_cup_winner_team_id: number | null;
  top_scorer: string;
  top_assist: string;
  hat_trick_player: string;
  most_goals_in_a_match_team_id: number | null;
  how_many_penalty_shootouts: string;
  underdog_quarterfinal_team_id: number | null;
  spain_top_scorer: string;
  spain_top_assist: string;
  spain_red_card_player: string;
  spain_round: string;
  spain_total_goals: string;
};

export type FieldType = "team-select" | "text" | "select";

export type PredictionFieldConfig = {
  name: keyof TournamentPredictionFormValues;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  section: "general" | "spain";
  description?: string;
};

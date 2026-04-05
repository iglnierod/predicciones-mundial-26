export interface Team {
  id: number;
  name: string;
  code: string;
  flag_code: string;
  group_id: number;
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

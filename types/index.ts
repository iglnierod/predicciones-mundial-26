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

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

import type { TournamentPredictionFormValues } from "@/types";

type FieldConfigBase = {
  name: keyof TournamentPredictionFormValues;
  label: string;
  placeholder?: string;
  section: "general" | "spain";
  points: number;
  scoringRuleKey: string;
};

export type TournamentPredictionFieldConfig = FieldConfigBase &
  (
    | {
        type: "text";
      }
    | {
        type: "team-select";
        top10?: boolean;
      }
    | {
        type: "select";
        options: { value: string; label: string }[];
      }
  );

export const TOURNAMENT_PREDICTION_FIELDS: TournamentPredictionFieldConfig[] = [
  {
    name: "world_cup_winner_team_id",
    label: "Campeón del Mundial",
    type: "team-select",
    section: "general",
    placeholder: "Selecciona el campeón",
    points: 10,
    scoringRuleKey: "tournament_world_cup_winner",
  },
  {
    name: "top_scorer",
    label: "Máximo goleador del Mundial",
    type: "text",
    section: "general",
    placeholder: "Ej. Kylian Mbappé",
    points: 7,
    scoringRuleKey: "tournament_top_scorer",
  },
  {
    name: "top_assist",
    label: "Máximo asistente del Mundial",
    type: "text",
    section: "general",
    placeholder: "Ej. Jude Bellingham",
    points: 7,
    scoringRuleKey: "tournament_top_assist",
  },
  {
    name: "hat_trick_player",
    label: "Jugador que hará un hat-trick",
    type: "text",
    section: "general",
    placeholder: "Ej. Lautaro Martínez",
    points: 5,
    scoringRuleKey: "tournament_hat_trick_player",
  },
  {
    name: "most_goals_in_a_match_team_id",
    label: "Selección con más goles en un partido",
    type: "team-select",
    section: "general",
    placeholder: "Selecciona un equipo",
    points: 5,
    scoringRuleKey: "tournament_most_goals_in_a_match_team",
  },
  {
    name: "how_many_penalty_shootouts",
    label: "¿Cuántas tandas de penaltis habrá?",
    type: "select",
    section: "general",
    placeholder: "Selecciona un rango",
    points: 5,
    scoringRuleKey: "tournament_penalty_shootouts",
    options: [
      { value: "0-1", label: "0-1" },
      { value: "2-3", label: "2-3" },
      { value: "4-5", label: "4-5" },
      { value: "6+", label: "6 o más" },
    ],
  },
  {
    name: "underdog_quarterfinal_team_id",
    label: "Selección sorpresa en cuartos (fuera del top 10 de la FIFA)",
    type: "team-select",
    top10: true,
    section: "general",
    placeholder: "Selecciona un equipo",
    points: 7,
    scoringRuleKey: "tournament_underdog_quarterfinal_team",
  },
  {
    name: "spain_top_scorer",
    label: "Máximo goleador de España",
    type: "text",
    section: "spain",
    placeholder: "Ej. Ferrán Torres",
    points: 5,
    scoringRuleKey: "tournament_spain_top_scorer",
  },
  {
    name: "spain_top_assist",
    label: "Máximo asistente de España",
    type: "text",
    section: "spain",
    placeholder: "Ej. Lamine Yamal",
    points: 5,
    scoringRuleKey: "tournament_spain_top_assist",
  },
  {
    name: "spain_red_card_player",
    label: "Jugador de España expulsado en algún partido",
    type: "text",
    section: "spain",
    placeholder: "Ej. Dani Carvajal",
    points: 4,
    scoringRuleKey: "tournament_spain_red_card_player",
  },
  {
    name: "spain_round",
    label: "¿Hasta qué ronda llegará España?",
    type: "select",
    section: "spain",
    placeholder: "Selecciona una ronda",
    points: 6,
    scoringRuleKey: "tournament_spain_round",
    options: [
      { value: "group", label: "Fase de grupos" },
      { value: "R32", label: "Dieciseisavos" },
      { value: "R16", label: "Octavos" },
      { value: "QF", label: "Cuartos" },
      { value: "SF", label: "Semifinales" },
      { value: "final", label: "Final" },
    ],
  },
  {
    name: "spain_total_goals",
    label: "¿Cuántos goles marcará España en todo el mundial?",
    type: "select",
    section: "spain",
    placeholder: "Selecciona un rango",
    points: 4,
    scoringRuleKey: "tournament_spain_total_goals",
    options: [
      { value: "0-5", label: "0-5" },
      { value: "6-10", label: "6-10" },
      { value: "11-15", label: "11-15" },
      { value: "16-20", label: "16-20" },
      { value: "21+", label: "21 o más" },
    ],
  },
];

export const TOURNAMENT_PREDICTION_FIELD_NAMES =
  TOURNAMENT_PREDICTION_FIELDS.map((field) => field.name);

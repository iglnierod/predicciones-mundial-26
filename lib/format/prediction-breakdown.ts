export function getMatchPredictionRuleText(
  ruleKey: string | null | undefined,
): string {
  if (ruleKey === "match_exact_score") return "Adivina resultado exacto";
  if (ruleKey === "match_winner_only") return "Adivina ganador";
  if (ruleKey === "match_winner_and_difference") {
    return "Adivina ganador y diferencia / empate";
  }
  if (ruleKey === "match_one_team_goals") return "Adivina goles de un equipo";
  return "Sin desglose";
}

export function formatPredictionResultLabel(
  result: string | null | undefined,
): string {
  if (result === "home") return "Gana local";
  if (result === "away") return "Gana visitante";
  if (result === "draw") return "Empate";
  return "—";
}

export function formatPredictionScore(
  home: number | null | undefined,
  away: number | null | undefined,
): string {
  if (home == null || away == null) return "—";
  return `${home} - ${away}`;
}

export function formatNullablePredictionNumber(
  value: number | null | undefined,
): string {
  if (value == null) return "—";
  return String(value);
}

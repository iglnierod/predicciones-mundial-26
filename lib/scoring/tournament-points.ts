import { TOURNAMENT_PREDICTION_FIELDS } from "@/lib/predictions/tournament-fields";
import type { ScoringRulesMap } from "@/lib/scoring/types";
import type {
  TournamentPrediction,
  TournamentPredictionFieldBreakdown,
  TournamentPredictionFormValues,
  TournamentPredictionPointsBreakdown,
  TournamentResult,
} from "@/types";

type TournamentScoringRow = TournamentPrediction | TournamentResult;

const MULTIPLE_RESULT_SEPARATOR_REGEX = /[;/|]/;

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

function isEmptyValue(value: unknown) {
  return value == null || (typeof value === "string" && value.trim() === "");
}

function normalizeTextValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getComparableValue(value: string | number | null) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return normalizeTextValue(value);
  return null;
}

function getComparableResultValue(
  value: string | number | null,
  allowMultipleResults: boolean | undefined,
) {
  if (!allowMultipleResults || typeof value !== "string") {
    return getComparableValue(value);
  }

  const values = value
    .split(MULTIPLE_RESULT_SEPARATOR_REGEX)
    .map(normalizeTextValue)
    .filter(Boolean);

  return [...new Set(values)].sort();
}

function isResultResolved(
  value: string | number | null,
  allowMultipleResults: boolean | undefined,
) {
  if (isEmptyValue(value)) return false;

  const comparableValue = getComparableResultValue(value, allowMultipleResults);

  return Array.isArray(comparableValue) ? comparableValue.length > 0 : true;
}

function isPredictionCorrect({
  predictedValue,
  resultValue,
  allowMultipleResults,
}: {
  predictedValue: string | number | null;
  resultValue: string | number | null;
  allowMultipleResults: boolean | undefined;
}) {
  const comparablePrediction = getComparableValue(predictedValue);
  const comparableResult = getComparableResultValue(
    resultValue,
    allowMultipleResults,
  );

  if (Array.isArray(comparableResult)) {
    return (
      typeof comparablePrediction === "string" &&
      comparableResult.includes(comparablePrediction)
    );
  }

  return comparablePrediction === comparableResult;
}

function getFieldValue(
  row: TournamentScoringRow,
  fieldName: keyof TournamentPredictionFormValues,
) {
  return row[fieldName] ?? null;
}

export function buildTournamentProcessedKey(result: TournamentResult | null) {
  if (!result) return "no-result";

  return JSON.stringify(
    Object.fromEntries(
      TOURNAMENT_PREDICTION_FIELDS.map((field) => [
        field.name,
        getComparableResultValue(
          getFieldValue(result, field.name),
          field.allowMultipleResults,
        ),
      ]),
    ),
  );
}

export function countResolvedTournamentFields(result: TournamentResult | null) {
  if (!result) return 0;

  return TOURNAMENT_PREDICTION_FIELDS.filter((field) =>
    isResultResolved(
      getFieldValue(result, field.name),
      field.allowMultipleResults,
    ),
  ).length;
}

export function calculateTournamentPredictionPoints({
  prediction,
  result,
  scoringRules,
}: {
  prediction: TournamentPrediction;
  result: TournamentResult;
  scoringRules: ScoringRulesMap;
}): TournamentPredictionPointsBreakdown {
  const fields: TournamentPredictionPointsBreakdown["fields"] = {};
  const processedKey = buildTournamentProcessedKey(result);
  let totalPoints = 0;
  let totalMaxPoints = 0;
  let resolvedFields = 0;

  for (const field of TOURNAMENT_PREDICTION_FIELDS) {
    const maxPoints = getRequiredRulePoints(scoringRules, field.scoringRuleKey);
    const predictedValue = getFieldValue(prediction, field.name);
    const resultValue = getFieldValue(result, field.name);
    const isAnswered = !isEmptyValue(predictedValue);
    const isResolved = isResultResolved(
      resultValue,
      field.allowMultipleResults,
    );

    let isCorrect = false;

    if (isAnswered && isResolved) {
      isCorrect = isPredictionCorrect({
        predictedValue,
        resultValue,
        allowMultipleResults: field.allowMultipleResults,
      });
    }

    const points = isCorrect ? maxPoints : 0;

    if (isResolved) {
      resolvedFields++;
      totalMaxPoints += maxPoints;
    }

    totalPoints += points;

    fields[field.name] = {
      label: field.label,
      ruleKey: field.scoringRuleKey,
      points,
      maxPoints,
      predictedValue,
      resultValue,
      isAnswered,
      isResolved,
      isCorrect,
    } satisfies TournamentPredictionFieldBreakdown;
  }

  return {
    points: totalPoints,
    maxPoints: totalMaxPoints,
    processedKey,
    resolvedFields,
    fields,
  };
}

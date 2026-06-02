import GroupsPredictionGrid from "@/components/groups/groups-prediction-grid";
import { createClient } from "@/lib/supabase/server";
import {
  areTournamentPredictionsClosed,
  getTournamentPredictionsCloseAt,
} from "@/lib/predictions/tournament-deadline";
import { GroupPredictionResults, GroupPredictionSelection } from "@/types";

type GroupPredictionPointRow = {
  group_id: number | null;
  points: number;
  breakdown: {
    matchedTeamIds?: unknown;
    maxPoints?: unknown;
  } | null;
};

function getNumberArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is number => typeof item === "number");
}

function getNullableNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

export default async function GroupsContent() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: groups, error: groupsError },
    closeAt,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("groups")
      .select(
        `
          id,
          name,
          qualified_team_a_id,
          qualified_team_b_id,
          teams!teams_group_id_fkey (
            id,
            name,
            code,
            flag_code,
            group_id
          )
        `,
      )
      .order("name"),
    getTournamentPredictionsCloseAt(supabase),
  ]);

  if (groupsError) {
    throw new Error("No se pudieron cargar los grupos");
  }

  let predictionSelection: GroupPredictionSelection = {};
  let predictionResults: GroupPredictionResults = {};

  if (user) {
    const [
      { data: predictions, error: predictionsError },
      { data: points, error: pointsError },
    ] = await Promise.all([
      supabase
        .from("group_predictions")
        .select("group_id, team_a_id, team_b_id")
        .eq("user_id", user.id),
      supabase
        .from("prediction_points")
        .select("group_id, points, breakdown")
        .eq("user_id", user.id)
        .eq("prediction_type", "group"),
    ]);

    if (predictionsError) {
      throw new Error("No se pudieron cargar las predicciones del usuario");
    }

    if (pointsError) {
      throw new Error("No se pudieron cargar los puntos de grupos del usuario");
    }

    predictionSelection = (predictions ?? []).reduce<GroupPredictionSelection>(
      (acc, prediction) => {
        acc[prediction.group_id] = [prediction.team_a_id, prediction.team_b_id];
        return acc;
      },
      {},
    );

    predictionResults = ((points ?? []) as GroupPredictionPointRow[]).reduce(
      (acc, point) => {
        if (point.group_id === null) return acc;

        acc[point.group_id] = {
          points: point.points,
          matchedTeamIds: getNumberArray(point.breakdown?.matchedTeamIds),
          maxPoints: getNullableNumber(point.breakdown?.maxPoints),
        };

        return acc;
      },
      {} as GroupPredictionResults,
    );
  }

  return (
    <GroupsPredictionGrid
      groups={groups ?? []}
      initialSelection={predictionSelection}
      predictionResults={predictionResults}
      isClosed={areTournamentPredictionsClosed(closeAt)}
      closeAt={closeAt}
    />
  );
}

import { SupabaseClient } from "@supabase/supabase-js";
import { TOURNAMENT_PREDICTION_FIELD_NAMES } from "@/lib/predictions/tournament-fields";
import type {
  Team,
  TournamentPrediction,
  TournamentPredictionPointsBreakdown,
  TournamentResult,
} from "@/types";

export type TournamentPredictionPointRow = {
  prediction_id: number;
  user_id: string;
  points: number;
  breakdown: TournamentPredictionPointsBreakdown | null;
};

export type AdminTournamentPrediction = TournamentPrediction & {
  full_name: string | null;
  avatar_url: string | null;
  points: number | null;
  breakdown: TournamentPredictionPointsBreakdown | null;
  is_calculated: boolean;
};

export type AdminGlobalPredictionsData = {
  result: TournamentResult | null;
  teams: Team[];
  predictions: AdminTournamentPrediction[];
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type SaveTournamentResultInput = Omit<
  TournamentResult,
  "id" | "updated_at"
>;

const predictionFieldsSelect = TOURNAMENT_PREDICTION_FIELD_NAMES.join(", ");
const tournamentPredictionSelect = `id, user_id, ${predictionFieldsSelect}`;
const tournamentResultSelect = `id, ${predictionFieldsSelect}, updated_at`;

export async function getTournamentResult(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("tournament_results")
    .select(tournamentResultSelect)
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar el resultado global: ${error.message}`);
  }

  return (data as TournamentResult | null) ?? null;
}

export async function saveTournamentResult(
  supabase: SupabaseClient,
  values: SaveTournamentResultInput,
) {
  const { data, error } = await supabase
    .from("tournament_results")
    .upsert(
      {
        id: 1,
        ...values,
      },
      { onConflict: "id" },
    )
    .select(tournamentResultSelect)
    .single();

  if (error) {
    throw new Error(`No se pudo guardar el resultado global: ${error.message}`);
  }

  return data as unknown as TournamentResult;
}

export async function getTournamentPredictions(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("tournament_predictions")
    .select(tournamentPredictionSelect)
    .order("id", { ascending: true });

  if (error) {
    throw new Error(
      `No se pudieron cargar las predicciones globales: ${error.message}`,
    );
  }

  return (data ?? []) as unknown as TournamentPrediction[];
}

export async function deleteTournamentPredictionPoints(
  supabase: SupabaseClient,
) {
  const { data: affectedRows, error } = await supabase
    .from("prediction_points")
    .delete()
    .eq("prediction_type", "tournament")
    .select("user_id");

  if (error) {
    throw new Error(
      `No se pudieron eliminar los puntos globales: ${error.message}`,
    );
  }

  const affectedUserIds = [
    ...new Set((affectedRows ?? []).map((row) => row.user_id)),
  ];

  return {
    deletedPoints: affectedRows?.length ?? 0,
    affectedUserIds,
  };
}

export async function insertTournamentPredictionPoints(
  supabase: SupabaseClient,
  rows: Array<{
    user_id: string;
    prediction_type: "tournament";
    prediction_id: number;
    match_id: null;
    group_id: null;
    points: number;
    breakdown: TournamentPredictionPointsBreakdown;
  }>,
) {
  if (rows.length === 0) return;

  const { error } = await supabase.from("prediction_points").insert(rows);

  if (error) {
    throw new Error(
      `No se pudieron guardar los puntos globales: ${error.message}`,
    );
  }
}

export async function getAdminGlobalPredictionsData(
  supabase: SupabaseClient,
): Promise<AdminGlobalPredictionsData> {
  const [resultResponse, teamsResponse, predictionsResponse, pointsResponse] =
    await Promise.all([
      supabase
        .from("tournament_results")
        .select(tournamentResultSelect)
        .eq("id", 1)
        .maybeSingle(),
      supabase
        .from("teams")
        .select("id, name, code, flag_code, group_id, is_top10_ranking_fifa")
        .order("name", { ascending: true }),
      supabase
        .from("tournament_predictions")
        .select(tournamentPredictionSelect)
        .order("id", { ascending: true }),
      supabase
        .from("prediction_points")
        .select("prediction_id, user_id, points, breakdown")
        .eq("prediction_type", "tournament"),
    ]);

  if (resultResponse.error) {
    throw new Error(
      `No se pudo cargar el resultado global: ${resultResponse.error.message}`,
    );
  }

  if (teamsResponse.error) {
    throw new Error(
      `No se pudieron cargar los equipos: ${teamsResponse.error.message}`,
    );
  }

  if (predictionsResponse.error) {
    throw new Error(
      `No se pudieron cargar las predicciones globales: ${predictionsResponse.error.message}`,
    );
  }

  if (pointsResponse.error) {
    throw new Error(
      `No se pudieron cargar los puntos globales: ${pointsResponse.error.message}`,
    );
  }

  const predictions = (predictionsResponse.data ??
    []) as unknown as TournamentPrediction[];
  const userIds = [
    ...new Set(predictions.map((prediction) => prediction.user_id)),
  ];
  let profilesById = new Map<string, ProfileRow>();

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    if (profilesError) {
      throw new Error(
        `No se pudieron cargar los usuarios: ${profilesError.message}`,
      );
    }

    profilesById = new Map(
      ((profiles ?? []) as ProfileRow[]).map((profile) => [
        profile.id,
        profile,
      ]),
    );
  }

  const pointsByPredictionId = new Map(
    ((pointsResponse.data ?? []) as TournamentPredictionPointRow[]).map(
      (point) => [point.prediction_id, point],
    ),
  );

  return {
    result: (resultResponse.data as TournamentResult | null) ?? null,
    teams: (teamsResponse.data ?? []) as Team[],
    predictions: predictions.map((prediction) => {
      const profile = profilesById.get(prediction.user_id) ?? null;
      const point = pointsByPredictionId.get(prediction.id) ?? null;

      return {
        ...prediction,
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        points: point?.points ?? null,
        breakdown: point?.breakdown ?? null,
        is_calculated: Boolean(point),
      };
    }),
  };
}

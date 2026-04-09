"use client";

import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

type PredictionRow = {
  id: number;
  user_id: string;
  full_name: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points: number | null;
  breakdown: {
    ruleKey: string | null;
  } | null;
  is_calculated: boolean;
};

type Props = {
  matchId: number;
};

export default function UsersPredictionTable({ matchId }: Props) {
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function getRuleText(ruleKey: string): string {
    if (ruleKey === "match_winner_only") return "Adivina ganador";
    if (ruleKey === "match_winner_and_difference")
      return "Adivina ganador y diferencia de goles / empate";
    if (ruleKey === "match_one_team_goals") return "Adivina goles de un equipo";
    return "";
  }

  useEffect(() => {
    let ignore = false;
    const supabase = createClient();

    async function getUser() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setUser(null);
        throw new Error("NO se pudo obtener el usuario autenticado");
      }

      setUser(user);
    }

    async function loadPredictions() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("match_predictions_result_overview")
        .select("*")
        .eq("match_id", matchId)
        .order("points", { ascending: false });

      if (ignore) return;

      if (error) {
        console.error(error);
        setError("No se pudieron cargar las predicciones");
        setPredictions([]);
      } else {
        setPredictions((data ?? []) as PredictionRow[]);
      }

      setLoading(false);
    }

    void getUser();
    void loadPredictions();

    return () => {
      ignore = true;
    };
  }, [matchId]);

  if (loading) {
    return (
      <div className="inline-flex w-full justify-center rounded-2xl border border-black/10 p-4">
        <LoaderCircle className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="rounded-2xl border border-black/10 p-4">
        <p className="text-sm text-black/60">
          Todavía no hay predicciones para este partido.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-black/5">
          <tr>
            <th className="px-4 py-3 text-left font-bold text-black">
              USUARIO
            </th>
            <th className="px-4 py-3 text-center font-bold text-black">
              RESULTADO
            </th>
            <th className="px-4 py-3 text-center font-bold text-black">
              PUNTOS
            </th>
          </tr>
        </thead>

        <tbody>
          {predictions.map((prediction) => {
            const ruleText = prediction.breakdown?.ruleKey
              ? getRuleText(prediction.breakdown.ruleKey)
              : "";

            return (
              <tr
                key={prediction.id}
                className={`border-t border-black/5 ${
                  user && user.id === prediction.user_id ? "bg-blue-900/15" : ""
                }`}
              >
                <td className="px-4 py-3">{prediction.full_name}</td>
                <td className="px-4 py-3 text-center">
                  {prediction.predicted_home_score} -{" "}
                  {prediction.predicted_away_score}
                </td>
                <td
                  className="cursor-help px-4 py-3 text-center font-extrabold"
                  title={ruleText}
                >
                  {prediction.is_calculated
                    ? `${prediction.points} pts`
                    : "SIN CALCULAR"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

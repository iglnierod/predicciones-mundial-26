import { createClient } from "../supabase/server";

export async function getGroupPredictions() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("groups_predictions").select("*");

  if (error) {
    console.error(
      `No se pudieron cargar las predicciones de grupos: ${error.message}`,
    );
  }

  return data ?? [];
}

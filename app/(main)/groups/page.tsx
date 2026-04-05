import GroupComponent from "@/components/group";
import PredictGroupsButton from "@/components/predict-groups-button";
import { createClient } from "@/lib/supabase/server";
import { GroupPredictionSelection } from "@/types";

export default async function GroupsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select(
      `
    id,
    name,
    teams!teams_group_id_fkey (
      id,
      name,
      code,
      flag_code,
      group_id
    )
  `,
    )
    .order("name");

  if (groupsError) {
    throw new Error("No se pudieron cargar los grupos");
  }

  let predictionSelection: GroupPredictionSelection = {};

  if (user) {
    const { data: predictions, error: predictionsError } = await supabase
      .from("group_predictions")
      .select("group_id, team_a_id, team_b_id")
      .eq("user_id", user.id);

    if (predictionsError) {
      throw new Error("No se pudieron cargar las predicciones del usuario");
    }

    predictionSelection = (predictions ?? []).reduce<GroupPredictionSelection>(
      (acc, prediction) => {
        acc[prediction.group_id] = [prediction.team_a_id, prediction.team_b_id];
        return acc;
      },
      {},
    );
  }

  return (
    <section>
      <div className="mb-6 flex w-full flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold">GRUPOS</h1>
          <h2 className="text-xl text-white/70">
            Haz tus predicciones de qué equipos pasarán de grupos
          </h2>
          <h3 className="text-xl text-white/90 underline">
            Las predicciones se cierran el día 10/06/2026
          </h3>
        </div>

        <PredictGroupsButton groups={groups ?? []} />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {groups?.map((group) => (
          <GroupComponent
            key={group.id}
            group={group}
            selectedTeamIds={predictionSelection[group.id] ?? []}
          />
        ))}
      </div>
    </section>
  );
}

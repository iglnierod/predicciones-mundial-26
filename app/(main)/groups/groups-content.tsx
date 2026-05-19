import GroupComponent from "@/components/groups/group";
import PredictGroupsButton from "@/components/groups/predict-groups-button";
import { createClient } from "@/lib/supabase/server";
import { GroupPredictionSelection } from "@/types";

export default async function GroupsContent() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: groups, error: groupsError },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
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
      .order("name"),
  ]);

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
    <>
      <div className="mb-6 flex justify-end">
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
    </>
  );
}

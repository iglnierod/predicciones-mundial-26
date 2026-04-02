import GroupComponent from "@/components/group";
import { createClient } from "@/lib/supabase/server";

export default async function GroupsPage() {
  const supabase = await createClient();

  const { data: groups } = await supabase
    .from("groups")
    .select(
      `id, name, teams (
      id, name, code, flag_code, group_id)`,
    )
    .order("name");

  return (
    <section>
      <h1 className="text-4xl font-semibold mb-2">GRUPOS</h1>
      <h2 className="text-xl text-white/70 mb-6">
        Haz tus predicciones de que equipos pasarán de grupos
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {groups?.map((group) => (
          <GroupComponent key={group.id} group={group} />
        ))}
      </div>
    </section>
  );
}

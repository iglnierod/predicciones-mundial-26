import { createClient } from "@/lib/supabase/server";
import LeaderboardTable from "@/components/leaderboard-table";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: leaderboard, error: leaderboardError } = await supabase
    .from("leaderboard")
    .select(
      `user_id, full_name, avatar_url, group_points, match_points,
      extra_points, tournament_points, total_points, rank`,
    )
    .order("rank", { ascending: true });

  if (leaderboardError) {
    throw new Error("No se pudo cargar la clasificación");
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold text-white">CLASIFICACIÓN</h1>
        <p className="text-lg text-white/70">
          Consulta la posición actual de los usuarios según sus puntos.
        </p>
      </div>

      <LeaderboardTable leaderboard={leaderboard} />
    </section>
  );
}

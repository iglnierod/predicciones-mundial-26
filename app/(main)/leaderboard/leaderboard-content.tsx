import { createClient } from "@/lib/supabase/server";
import LeaderboardTable from "@/components/leaderboard-table";

export default async function LeaderboardContent() {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: leaderboard, error: leaderboardError },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("leaderboard")
      .select(
        `user_id, full_name, avatar_url, group_points, match_points,
        extra_points, tournament_points, total_points, rank`,
      )
      .order("rank", { ascending: true }),
  ]);

  if (leaderboardError || !user) {
    throw new Error("No se pudo cargar la clasificación");
  }

  return <LeaderboardTable leaderboard={leaderboard} userId={user.id} />;
}

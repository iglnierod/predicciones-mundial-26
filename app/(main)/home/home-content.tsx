import HomeDashboard from "@/components/home/home-dashboard";
import {
  getHomePredictionStatus,
  getHomeTournamentTiming,
  getLastPlayedHomeMatches,
  getLeaderboardEvolution,
  getUpcomingHomeMatches,
} from "@/lib/repositories/home-repository";
import { createClient } from "@/lib/supabase/server";

export default async function HomeContent() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("No se pudo obtener el usuario autenticado");
  }

  const [
    predictionStatus,
    tournamentTiming,
    upcomingMatches,
    lastPlayedMatches,
    leaderboardSeries,
  ] = await Promise.all([
    getHomePredictionStatus(supabase, user.id),
    getHomeTournamentTiming(supabase),
    getUpcomingHomeMatches(supabase),
    getLastPlayedHomeMatches(supabase, user.id),
    getLeaderboardEvolution(supabase, user.id),
  ]);

  return (
    <HomeDashboard
      predictionStatus={predictionStatus}
      tournamentTiming={tournamentTiming}
      upcomingMatches={upcomingMatches}
      lastPlayedMatches={lastPlayedMatches}
      leaderboardSeries={leaderboardSeries}
    />
  );
}

import { Suspense } from "react";
import LeaderboardTableSkeleton from "./leaderboard-skeleton";
import LeaderboardContent from "./leaderboard-content";

export default async function LeaderboardPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold text-white">CLASIFICACIÓN</h1>
        <p className="text-lg text-white/70">
          Consulta la posición actual de los usuarios según sus puntos.
        </p>
      </div>

      {/* <LeaderboardTableSkeleton></LeaderboardTableSkeleton> */}
      <Suspense fallback={<LeaderboardTableSkeleton />}>
        <LeaderboardContent />
      </Suspense>
    </section>
  );
}

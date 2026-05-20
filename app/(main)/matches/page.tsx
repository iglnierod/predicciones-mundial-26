import { Suspense } from "react";
import MatchesContent from "./matches-content";
import MatchesSkeleton from "./matches-skeleton";

type Props = {
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function MatchesPage({ searchParams }: Props) {
  const { tab } = await searchParams;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold text-white">PARTIDOS</h1>
        <p className="text-lg text-white/70">
          Consulta los partidos y haz tus predicciones.
        </p>
      </div>

      <Suspense fallback={<MatchesSkeleton />} key={tab ?? "scheduled"}>
        <MatchesContent initialTab={tab} />
      </Suspense>
    </section>
  );
}

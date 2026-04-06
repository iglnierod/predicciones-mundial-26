import { Suspense } from "react";

import GroupsContent from "./groups-content";
import GroupsGridSkeleton from "./groups-grid-skeleton";

export default function GroupsPage() {
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
      </div>

      <Suspense fallback={<GroupsGridSkeleton />}>
        <GroupsContent />
      </Suspense>
    </section>
  );
}

import { Suspense } from "react";

import GroupsContent from "./groups-content";
import GroupsGridSkeleton from "./groups-grid-skeleton";

export default function GroupsPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold text-white">GRUPOS</h1>
        <p className="text-lg text-white/70">
          Elige directamente los 2 equipos que crees que pasarán de cada grupo.
        </p>
      </div>

      <Suspense fallback={<GroupsGridSkeleton />}>
        <GroupsContent />
      </Suspense>
    </section>
  );
}

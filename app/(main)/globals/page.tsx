import { Suspense } from "react";
import GlobalsGridSkeleton from "./globals-grid-skeleton";
import GlobalsContent from "./globals-content";

export default function GlobalsPage() {
  return (
    <section>
      <div className="mb-6 flex w-full flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold">PREDICCIONES GLOBALES</h1>
          <h2 className="text-xl text-white/70">
            Haz tus predicciones generales sobre lo que pasará en el torneo
          </h2>
          <h3 className="text-xl text-white/90 underline">
            Las predicciones se cierran el día 10/06/2026
          </h3>
        </div>
      </div>

      <Suspense fallback={<GlobalsGridSkeleton />}>
        <GlobalsContent />
      </Suspense>
    </section>
  );
}

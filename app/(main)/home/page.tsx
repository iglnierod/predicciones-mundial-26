import { Suspense } from "react";
import HomeContent from "./home-content";
import HomeSkeleton from "./home-skeleton";

export default async function HomePage() {
  return (
    <section className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold text-white">INICIO</h1>
        <p className="max-w-2xl text-lg text-white/70">
          Revisa tus pendientes, próximos partidos y evolución en la
          clasificación.
        </p>
      </div>

      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </section>
  );
}

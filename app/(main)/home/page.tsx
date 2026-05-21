import { Suspense } from "react";
import HomeContent from "./home-content";
import HomeSkeleton from "./home-skeleton";

export default async function HomePage() {
  return (
    <section className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <p className="inline-flex w-fit rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold tracking-wide text-white/70 ring-1 ring-white/10">
          MUNDIAL 2026
        </p>
        <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
          INICIO
        </h1>
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

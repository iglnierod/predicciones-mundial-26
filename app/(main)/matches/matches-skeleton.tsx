function MatchCardSkeleton() {
  return (
    <article className="rounded-3xl border border-white/10 bg-black/40 p-4 shadow-2xl ring-1 ring-white/10 backdrop-blur-md">
      <div className="mb-4 grid grid-cols-[1fr_auto] items-start gap-3">
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-white/10" />
        </div>

        <div className="flex items-center gap-2">
          <div className="h-7 w-16 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-12 w-18 animate-pulse rounded-tr-xl rounded-bl-xl border border-white/10 bg-white/10" />
          <div className="h-5 w-12 animate-pulse rounded bg-white/10" />
        </div>

        <div className="flex min-w-27.5 flex-col items-center justify-center gap-2">
          <div className="flex gap-2">
            <div className="h-10 w-14 animate-pulse rounded-md bg-white/10" />
            <div className="h-10 w-4 animate-pulse rounded bg-white/10" />
            <div className="h-10 w-14 animate-pulse rounded-md bg-white/10" />
          </div>

          <div className="mb-2 h-3 w-24 animate-pulse rounded bg-white/10" />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-12 w-18 animate-pulse rounded-tl-xl rounded-br-xl border border-white/10 bg-white/10" />
          <div className="h-5 w-12 animate-pulse rounded bg-white/10" />
        </div>
      </div>

      <div className="mt-4 flex justify-between gap-2">
        <div className="h-11 w-full animate-pulse rounded-2xl bg-white/10" />
      </div>
    </article>
  );
}

export default function MatchesSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <MatchCardSkeleton key={index} />
      ))}
    </div>
  );
}

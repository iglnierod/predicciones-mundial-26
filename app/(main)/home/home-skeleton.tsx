export default function HomeSkeleton() {
  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-black/5 bg-white/85 p-4 shadow-[0_16px_42px_rgba(0,0,0,0.16)] ring-1 ring-white/30 backdrop-blur-sm md:p-5">
        <div className="mb-4">
          <div>
            <div className="h-5 w-28 animate-pulse rounded-full bg-black/5" />
            <div className="mt-2 h-7 w-64 animate-pulse rounded-2xl bg-black/5" />
            <div className="mt-2 h-4 w-full max-w-xl animate-pulse rounded-full bg-black/5" />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="h-32 animate-pulse rounded-2xl border border-black/5 bg-white shadow-sm" />
          <div className="h-32 animate-pulse rounded-2xl border border-black/5 bg-white shadow-sm" />
        </div>
      </div>

      <div className="rounded-[2rem] border border-black/5 bg-white/85 p-4 shadow-[0_16px_42px_rgba(0,0,0,0.16)] ring-1 ring-white/30 backdrop-blur-sm md:p-5">
        <div className="mb-5 border-b border-black/5 pb-5">
          <div className="h-6 w-36 animate-pulse rounded-full bg-black/5" />
          <div className="mt-3 h-10 w-full max-w-xl animate-pulse rounded-2xl bg-black/5" />
          <div className="mt-3 h-5 w-full max-w-2xl animate-pulse rounded-full bg-black/5" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
          <div className="space-y-3">
            <div className="h-64 animate-pulse rounded-[1.75rem] bg-[#2A398D] shadow-sm" />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={`upcoming-${index}`}
                  className="h-28 animate-pulse rounded-2xl border border-black/5 bg-white shadow-sm"
                />
              ))}
            </div>
          </div>

          <div className="space-y-3 xl:border-l xl:border-black/5 xl:pl-7">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={`completed-${index}`}
                className="h-36 animate-pulse rounded-2xl border border-black/5 bg-white shadow-sm"
              />
            ))}
          </div>
        </div>

        <div className="mt-5 border-t border-black/5 pt-5">
          <div className="h-72 animate-pulse rounded-3xl border border-black/5 bg-white shadow-sm" />
        </div>
      </div>
    </div>
  );
}

export default function HomeSkeleton() {
  return (
    <div className="rounded-[2rem] border border-black/5 bg-white/85 p-4 shadow-[0_16px_42px_rgba(0,0,0,0.16)] ring-1 ring-white/30 backdrop-blur-sm md:p-6">
      <div className="mb-7 border-b border-black/5 pb-6">
        <div className="h-6 w-36 animate-pulse rounded-full bg-black/5" />
        <div className="mt-3 h-10 w-full max-w-xl animate-pulse rounded-2xl bg-black/5" />
        <div className="mt-3 h-5 w-full max-w-2xl animate-pulse rounded-full bg-black/5" />
      </div>

      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-7">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-40 animate-pulse rounded-3xl border border-black/5 bg-white shadow-sm" />
            <div className="h-40 animate-pulse rounded-3xl border border-black/5 bg-white shadow-sm" />
          </div>
          <div className="h-64 animate-pulse rounded-3xl border border-black/5 bg-white shadow-sm" />
        </div>

        <div className="space-y-3 xl:border-l xl:border-black/5 xl:pl-7">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-3xl border border-black/5 bg-white shadow-sm"
            />
          ))}
        </div>
      </div>

      <div className="mt-7 border-t border-black/5 pt-7">
        <div className="h-72 animate-pulse rounded-3xl border border-black/5 bg-white shadow-sm" />
      </div>
    </div>
  );
}

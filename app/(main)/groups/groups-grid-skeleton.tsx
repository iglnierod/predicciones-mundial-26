function GroupCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-black/5 bg-white/85 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 h-6 w-20 rounded-full bg-black/10" />
          <div className="h-7 w-12 rounded bg-black/10" />
        </div>
        <div className="h-6 w-24 rounded-full bg-black/10" />
      </div>
      <div className="space-y-3">
        <div className="h-12 rounded-2xl bg-black/10" />
        <div className="h-12 rounded-2xl bg-black/10" />
        <div className="h-12 rounded-2xl bg-black/10" />
        <div className="h-12 rounded-2xl bg-black/10" />
      </div>
    </div>
  );
}

export default function GroupsGridSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-20 animate-pulse rounded-3xl border border-white/10 bg-white/10" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <GroupCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

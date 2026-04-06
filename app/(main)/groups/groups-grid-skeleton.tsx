function GroupCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 h-6 w-24 rounded bg-white/10" />
      <div className="space-y-3">
        <div className="h-10 rounded bg-white/10" />
        <div className="h-10 rounded bg-white/10" />
        <div className="h-10 rounded bg-white/10" />
        <div className="h-10 rounded bg-white/10" />
      </div>
    </div>
  );
}

export default function GroupsGridSkeleton() {
  return (
    <>
      <div className="mb-6 flex justify-end">
        <div className="h-20 w-52 animate-pulse rounded-xl bg-white/10" />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <GroupCardSkeleton key={index} />
        ))}
      </div>
    </>
  );
}

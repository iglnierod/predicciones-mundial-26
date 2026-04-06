export default function LeaderboardTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl ring-1 ring-white/10 backdrop-blur-md">
      <table className="w-full border-collapse text-white">
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-sm tracking-wide text-white/60 uppercase">
            <th className="px-4 py-4 text-left font-semibold sm:px-6">
              Posición
            </th>
            <th className="px-4 py-4 text-left font-semibold sm:px-6">
              Usuario
            </th>
            <th className="px-4 py-4 text-right font-semibold sm:px-6">
              Total
            </th>
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: 8 }).map((_, index) => (
            <tr
              key={index}
              className="border-b border-white/10 transition last:border-b-0"
            >
              <td className="px-4 py-4 sm:px-6">
                <div className="h-8 w-14 animate-pulse rounded-full bg-white/10" />
              </td>

              <td className="px-4 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 animate-pulse rounded-full border border-white/10 bg-white/10" />

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 h-4 w-32 animate-pulse rounded bg-white/10 sm:w-32" />
                    <div className="h-3 w-48 animate-pulse rounded bg-white/10 sm:w-46" />
                  </div>
                </div>
              </td>

              <td className="px-4 py-4 text-right sm:px-6">
                <div className="flex flex-col items-end">
                  <div className="mb-2 h-6 w-10 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-12 animate-pulse rounded bg-white/10" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

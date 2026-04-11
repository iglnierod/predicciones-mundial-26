function FieldSkeleton({ withPreview = false }: { withPreview?: boolean }) {
  return (
    <div className="space-y-2">
      <div className="h-4 w-40 rounded bg-black/10" />

      <div className="h-12 rounded-2xl border border-black/5 bg-white/70" />

      {withPreview && (
        <div className="rounded-2xl border border-black/5 bg-white/70 px-4 py-3">
          <div className="grid grid-cols-[auto_1fr] items-center gap-4">
            <div className="h-12 w-18 rounded-tr-xl rounded-bl-xl bg-black/10" />

            <div className="space-y-2">
              <div className="h-5 w-24 rounded bg-black/10" />
              <div className="h-4 w-32 rounded bg-black/10" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PredictionSectionSkeleton({
  badge,
  titleWidth,
  descriptionWidth,
  fields,
}: {
  badge: string;
  titleWidth: string;
  descriptionWidth: string;
  fields: Array<{ withPreview?: boolean }>;
}) {
  return (
    <article className="rounded-3xl border border-black/5 bg-white/85 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-white/30 backdrop-blur-sm md:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
            {badge}
          </div>

          <div className={`h-7 rounded bg-black/10 ${titleWidth}`} />
          <div className={`mt-2 h-4 rounded bg-black/10 ${descriptionWidth}`} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field, index) => (
          <FieldSkeleton key={index} withPreview={field.withPreview} />
        ))}
      </div>
    </article>
  );
}

export default function GlobalsFormSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <PredictionSectionSkeleton
        badge="MUNDIAL"
        titleWidth="w-56"
        descriptionWidth="w-72"
        fields={[
          { withPreview: true },
          {},
          {},
          {},
          { withPreview: true },
          {},
          { withPreview: true },
        ]}
      />

      <PredictionSectionSkeleton
        badge="ESPAÑA"
        titleWidth="w-52"
        descriptionWidth="w-80"
        fields={[{}, {}, {}, {}, {}]}
      />

      <div className="flex justify-center sm:justify-end">
        <div className="h-12 w-64 rounded-2xl bg-[#2A398D]/20" />
      </div>
    </div>
  );
}

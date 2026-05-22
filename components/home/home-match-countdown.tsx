"use client";

import { useEffect, useState } from "react";
import { parseUtcDate } from "@/lib/format/match";

type Props = {
  kickoffAt: string;
};

function getCountdownParts(kickoffAt: string) {
  const remainingMs = parseUtcDate(kickoffAt).getTime() - Date.now();
  const totalSeconds = Math.max(Math.floor(remainingMs / 1000), 0);

  return {
    isStarted: remainingMs <= 0,
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

function CountdownUnit({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  const displayValue =
    typeof value === "number" ? String(value).padStart(2, "0") : value;

  return (
    <div className="rounded-xl bg-white/12 px-2.5 py-2 text-center ring-1 ring-white/10">
      <p className="text-xl leading-none font-black text-white tabular-nums">
        {displayValue}
      </p>
      <p className="mt-0.5 text-[9px] font-black tracking-wide text-white/55">
        {label}
      </p>
    </div>
  );
}

export default function HomeMatchCountdown({ kickoffAt }: Props) {
  const [parts, setParts] = useState<ReturnType<
    typeof getCountdownParts
  > | null>(null);

  useEffect(() => {
    function updateParts() {
      setParts(getCountdownParts(kickoffAt));
    }

    updateParts();

    const timer = window.setInterval(updateParts, 1000);

    return () => window.clearInterval(timer);
  }, [kickoffAt]);

  if (!parts) {
    // Show 3 placeholders instead of 4 initially, as we don't know the days.
    // It avoids a layout jump if days is 0. If days > 0, it expands to 4 cols.
    return (
      <div aria-live="polite" className="grid grid-cols-3 gap-2">
        <CountdownUnit label="HORAS" value="--" />
        <CountdownUnit label="MIN" value="--" />
        <CountdownUnit label="SEG" value="--" />
      </div>
    );
  }

  if (parts.isStarted) {
    return (
      <div className="rounded-2xl bg-emerald-400/15 px-3 py-2 text-center text-xs font-black text-emerald-100 ring-1 ring-emerald-300/20">
        El partido ya debería haber empezado
      </div>
    );
  }

  return (
    <div
      aria-live="polite"
      className={`grid gap-2 ${parts.days > 0 ? "grid-cols-4" : "grid-cols-3"}`}
    >
      {parts.days > 0 && <CountdownUnit label="DÍAS" value={parts.days} />}
      <CountdownUnit label="HORAS" value={parts.hours} />
      <CountdownUnit label="MIN" value={parts.minutes} />
      <CountdownUnit label="SEG" value={parts.seconds} />
    </div>
  );
}

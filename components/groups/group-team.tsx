import { Team } from "@/types";
import { Check, CircleCheck, CircleX } from "lucide-react";
import Image from "next/image";

type ResultStatus = "correct" | "incorrect" | null;

type Props = {
  team: Team;
  isPredicted?: boolean;
  resultStatus?: ResultStatus;
  disabled?: boolean;
  onClick?: () => void;
};

export default function GroupTeam({
  team,
  isPredicted = false,
  resultStatus = null,
  disabled = false,
  onClick,
}: Props) {
  const resultClassName =
    resultStatus === "correct"
      ? "border-green-500/30 bg-green-50 hover:bg-green-50"
      : resultStatus === "incorrect"
        ? "border-red-500/30 bg-red-50 hover:bg-red-50"
        : "border-[#2A398D]/40 bg-[#2A398D]/10 hover:bg-[#2A398D]/15";

  const selectedTextClassName =
    resultStatus === "correct"
      ? "text-green-700"
      : resultStatus === "incorrect"
        ? "text-red-700"
        : "text-[#2A398D]";

  return (
    <button
      type="button"
      aria-pressed={isPredicted}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left shadow-sm transition disabled:cursor-not-allowed ${
        isPredicted
          ? resultClassName
          : "border-black/5 bg-white/65 hover:bg-white hover:shadow-md disabled:opacity-45"
      }`}
    >
      <div className="shrink-0 overflow-hidden rounded-tr-xl rounded-bl-xl border border-black/5 bg-white shadow-sm">
        <Image
          src={`https://flagcdn.com/w80/${team.flag_code}.png`}
          alt={`Bandera de ${team.name}`}
          width={48}
          height={32}
          className="aspect-auto h-8 w-12 object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3
          className={`truncate text-sm font-semibold sm:text-base ${
            isPredicted ? selectedTextClassName : "text-black"
          }`}
        >
          {team.name}
        </h3>
        <p
          className={`text-xs font-medium tracking-wide ${
            isPredicted ? selectedTextClassName : "text-black/50"
          }`}
        >
          {team.code}
        </p>
      </div>

      {resultStatus === "correct" && (
        <CircleCheck className="h-6 w-6 shrink-0 text-green-600" />
      )}

      {resultStatus === "incorrect" && (
        <CircleX className="h-6 w-6 shrink-0 text-red-600" />
      )}

      {isPredicted && resultStatus === null && (
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2A398D] text-white">
          <Check className="h-4 w-4" />
        </span>
      )}
    </button>
  );
}

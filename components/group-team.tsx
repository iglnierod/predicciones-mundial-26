import { Team } from "@/types";
import Image from "next/image";

type Props = {
  team: Team;
  isPredicted?: boolean;
};

export default function GroupTeam({ team, isPredicted = false }: Props) {
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border px-2 py-2 shadow-sm transition ${
        isPredicted
          ? "border-[#E4D6A3] bg-[#E8D8A8] hover:bg-[#E2CF96]"
          : "border-black/5 bg-white/65 hover:bg-white hover:shadow-md"
      }`}
    >
      <div className="flex h-7 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-black/5 bg-white">
        <Image
          src={`https://flagcdn.com/w80/${team.flag_code}.png`}
          alt={`Bandera de ${team.name}`}
          width={40}
          height={28}
          className="h-full w-full object-contain"
        />
      </div>

      <div className="min-w-0">
        <h3
          className={`truncate text-sm font-semibold sm:text-base ${
            isPredicted ? "text-[#3A2F12]" : "text-black"
          }`}
        >
          {team.name}
        </h3>
        <p
          className={`text-xs font-medium tracking-wide ${
            isPredicted ? "text-[#5A4A1F]" : "text-black/50"
          }`}
        >
          {team.code}
        </p>
      </div>
    </div>
  );
}

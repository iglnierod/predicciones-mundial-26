import { Team } from "@/types";
import Image from "next/image";

type Props = {
  team: Team;
};

export default function GroupTeam({ team }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white/65 px-2 py-2 shadow-sm transition hover:bg-white hover:shadow-md">
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
        <h3 className="truncate text-sm font-semibold text-black sm:text-base">
          {team.name}
        </h3>
        <p className="text-xs font-medium tracking-wide text-black/50">
          {team.code}
        </p>
      </div>
    </div>
  );
}

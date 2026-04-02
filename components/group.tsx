import { Group } from "@/types";
import GroupTeam from "./group-team";

type Props = {
  group: Group;
};

export default function GroupComponent({ group }: Props) {
  return (
    <section className="rounded-3xl bg-white/85 p-5 text-black shadow-[0_12px_40px_rgba(0,0,0,0.22)] ring-1 ring-white/30 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-wide text-[#2A398D] sm:text-xl">
          GRUPO {group.name}
        </h2>
        {/* <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-xs font-bold text-[#2A398D]">
          {group.teams?.length ?? 0} equipos
        </span> */}
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {group.teams?.map((team) => (
          <GroupTeam key={team.id} team={team} />
        ))}
      </div>
    </section>
  );
}

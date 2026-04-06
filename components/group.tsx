import { Group } from "@/types";
import GroupTeam from "./group-team";

type Props = {
  group: Group;
  selectedTeamIds?: number[];
};

export default function GroupComponent({ group, selectedTeamIds = [] }: Props) {
  return (
    <section className="rounded-3xl border border-black/5 bg-gray-200/95 p-4 text-black shadow-[0_12px_40px_rgba(0,0,0,0.22)] ring-1 ring-white/30 backdrop-blur-sm">
      <div className="mb-4 flex justify-between">
        <h2 className="text-lg font-extrabold tracking-wide text-[#2A398D] sm:text-xl">
          GRUPO {group.name}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {group.teams?.map((team) => (
          <GroupTeam
            key={team.id}
            team={team}
            isPredicted={selectedTeamIds.includes(team.id)}
          />
        ))}
      </div>
    </section>
  );
}

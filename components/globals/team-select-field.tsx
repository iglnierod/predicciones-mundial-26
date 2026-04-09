import { Team } from "@/types";
import Image from "next/image";

type Props = {
  label: string;
  value: number | null;
  teams: Team[];
  placeholder?: string;
  onChange: (value: number | null) => void;
};

function getTeamImageSrc(team: Team) {
  if (team.flag_code) {
    return `https://flagcdn.com/w160/${team.flag_code.toLowerCase()}.png`;
  }

  return null;
}

export default function TeamSelectField({
  label,
  value,
  teams,
  placeholder = "Selecciona un equipo",
  onChange,
}: Props) {
  const selectedTeam = teams.find((team) => team.id === value) ?? null;
  const selectedTeamImageSrc = selectedTeam
    ? getTeamImageSrc(selectedTeam)
    : null;

  return (
    <div className="space-y-2">
      <label className="block text-[13px] font-bold tracking-wide text-black">
        {label}
      </label>

      <div className="space-y-3">
        <select
          value={value ?? ""}
          onChange={(event) => {
            const rawValue = event.target.value;
            onChange(rawValue === "" ? null : Number(rawValue));
          }}
          className="w-full cursor-pointer rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black shadow-sm transition outline-none focus:border-[#2A398D]/40 focus:ring-2 focus:ring-[#2A398D]/10"
        >
          <option value="">{placeholder}</option>

          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>

        {selectedTeam ? (
          <div className="rounded-xl border border-black/5 bg-white px-4 py-3 shadow-sm">
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="overflow-hidden rounded-tr-xl rounded-bl-xl border border-black/5 bg-white shadow-sm">
                  {selectedTeamImageSrc ? (
                    <Image
                      src={selectedTeamImageSrc}
                      alt={selectedTeam.name}
                      width={72}
                      height={48}
                      className="h-12 w-18 object-cover"
                      title={selectedTeam.name}
                    />
                  ) : (
                    <div className="h-12 w-18 bg-black/5" />
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <p
                  className="truncate text-lg font-extrabold tracking-wide text-black"
                  title={selectedTeam.name}
                >
                  {selectedTeam.name}
                </p>

                <p className="truncate text-sm font-medium text-black/55">
                  {selectedTeam.code}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

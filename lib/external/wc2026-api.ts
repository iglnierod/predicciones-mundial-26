export type Wc2026Standing = {
  group_name: string;
  team_id: number;
  team_name: string;
  team_code: string;
  flag_url: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
};

export type Wc2026GroupResponse = {
  id: number;
  name: string;
  standings: Wc2026Standing[];
};

export type QualifiedGroupFromApi = {
  groupId: number;
  groupName: string;
  qualifiedTeamAApiId: number;
  qualifiedTeamBApiId: number;
};

function sortStandings(standings: Wc2026Standing[]) {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_difference !== a.goal_difference) {
      return b.goal_difference - a.goal_difference;
    }
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    if (b.won !== a.won) return b.won - a.won;

    return a.team_name.localeCompare(b.team_name);
  });
}

async function fetchGroupWithStandings(
  groupName: string,
): Promise<Wc2026GroupResponse> {
  const baseUrl = process.env.WC26_API_URL;
  const wcApiKey = process.env.WC26_API_KEY;

  if (!baseUrl) {
    throw new Error("WC2026_API_BASE_URL no está definida");
  }

  const response = await fetch(`${baseUrl}/groups/${groupName}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${wcApiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Error obteniendo el grupo ${groupName}: ${response.status}`,
    );
  }
  return response.json();
}

const GROUP_NAMES = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
];

export async function fetchWorldCupQualifiedGroups(): Promise<
  QualifiedGroupFromApi[]
> {
  const groups = await Promise.all(
    GROUP_NAMES.map(async (groupName) => {
      const group = await fetchGroupWithStandings(groupName);

      if (!group.standings || group.standings.length < 2) {
        throw new Error(`El grupo ${groupName} no tiene standings suficientes`);
      }

      const sortedStandings = sortStandings(group.standings);

      const first = sortedStandings[0];
      const second = sortedStandings[1];

      return {
        groupId: group.id,
        groupName: group.name,
        qualifiedTeamAApiId: first.team_id,
        qualifiedTeamBApiId: second.team_id,
      };
    }),
  );

  return groups;
}

import { ApiMatch } from "@/types";

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

const GROUP_NAMES_BY_ID: Record<number, string> = {
  1: "A",
  2: "B",
  3: "C",
  4: "D",
  5: "E",
  6: "F",
  7: "G",
  8: "H",
  9: "I",
  10: "J",
  11: "K",
  12: "L",
};

function sortStandings(standings: Wc2026Standing[]) {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;

    if (b.goal_difference !== a.goal_difference) {
      return b.goal_difference - a.goal_difference;
    }

    if (b.goals_for !== a.goals_for) {
      return b.goals_for - a.goals_for;
    }

    if (b.won !== a.won) {
      return b.won - a.won;
    }

    return a.team_name.localeCompare(b.team_name);
  });
}

function getQualifiedTeamsFromGroup(
  group: Wc2026GroupResponse,
): QualifiedGroupFromApi {
  if (!group.standings || group.standings.length < 2) {
    throw new Error(`El grupo ${group.name} no tiene standings suficientes`);
  }

  const sortedStandings = sortStandings(group.standings);

  const first = sortedStandings[0];
  const second = sortedStandings[1];

  if (!first || !second) {
    throw new Error(
      `No se pudieron obtener los dos clasificados del grupo ${group.name}`,
    );
  }

  return {
    groupId: group.id,
    groupName: group.name,
    qualifiedTeamAApiId: first.team_id,
    qualifiedTeamBApiId: second.team_id,
  };
}

async function fetchGroupWithStandings(
  groupName: string,
): Promise<Wc2026GroupResponse> {
  const baseUrl = process.env.WC26_API_URL;
  const wcApiKey = process.env.WC26_API_KEY;

  if (!baseUrl) {
    throw new Error("WC26_API_URL no está definida");
  }

  if (!wcApiKey) {
    throw new Error("WC26_API_KEY no está definida");
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

  return response.json() as Promise<Wc2026GroupResponse>;
}

export async function fetchWorldCupQualifiedGroups(): Promise<
  QualifiedGroupFromApi[]
> {
  const groups = await Promise.all(
    GROUP_NAMES.map(async (groupName) => {
      const group = await fetchGroupWithStandings(groupName);

      return getQualifiedTeamsFromGroup(group);
    }),
  );

  return groups;
}

export async function fetchWorldCupQualifiedGroup(
  groupId: number,
): Promise<QualifiedGroupFromApi> {
  const groupName = GROUP_NAMES_BY_ID[groupId];

  if (!groupName) {
    throw new Error(`No existe ningún grupo con id ${groupId}`);
  }

  const group = await fetchGroupWithStandings(groupName);

  if (group.id !== groupId) {
    throw new Error(
      `La API devolvió el grupo ${group.id} (${group.name}), pero se esperaba el grupo ${groupId}`,
    );
  }

  return getQualifiedTeamsFromGroup(group);
}

export async function fetchWc2026Matches(): Promise<ApiMatch[]> {
  const wcApiUrl = process.env.WC26_API_URL;
  const wcApiKey = process.env.WC26_API_KEY;

  if (!wcApiUrl || !wcApiKey) {
    throw new Error("Faltan la url y key de la WC26 API");
  }

  const response = await fetch(`${wcApiUrl}/matches`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${wcApiKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `No se pudieron obtener los partidos de la API: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as ApiMatch[];
}

export async function fetchWc2026MatchByApiId(
  apiMatchId: number,
): Promise<ApiMatch> {
  const wcApiUrl = process.env.WC26_API_URL;
  const wcApiKey = process.env.WC26_API_KEY;

  if (!wcApiUrl || !wcApiKey) {
    throw new Error("Faltan la url y key de la WC26 API");
  }

  const response = await fetch(`${wcApiUrl}/matches/${apiMatchId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${wcApiKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `No se pudo obtener el partido de la API: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as ApiMatch;
}

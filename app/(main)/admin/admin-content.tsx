"use client";

import { CalendarClock, Trophy, UsersRound } from "lucide-react";
import { useState } from "react";
import { GroupWithQualifiedTeams, MatchWithDetails } from "@/types";
import AdminMatchesPanel from "@/components/admin/admin-matches-panel";
import AdminGroupsPanel from "@/components/admin/admin-groups-panel";
import AdminGlobalPredictionsPanel from "@/components/admin/admin-global-predictions-panel";

type AdminTab = "matches" | "groups" | "globals";

type Props = {
  initialGroups: GroupWithQualifiedTeams[];
  initialMatches: MatchWithDetails[];
};

const tabs: {
  id: AdminTab;
  label: string;
  icon: React.ElementType;
}[] = [
  {
    id: "matches",
    label: "PARTIDOS",
    icon: CalendarClock,
  },
  {
    id: "groups",
    label: "GRUPOS",
    icon: UsersRound,
  },
  {
    id: "globals",
    label: "GLOBALES",
    icon: Trophy,
  },
];

export default function AdminContent({ initialGroups, initialMatches }: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>("matches");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex cursor-pointer items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition hover:scale-95 ${
                isActive
                  ? "bg-[#2A398D] text-white"
                  : "border border-white/10 bg-black/40 text-white/80 hover:bg-black/50"
              }`}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "matches" && (
        <AdminMatchesPanel initialMatches={initialMatches} />
      )}

      {activeTab === "groups" && (
        <AdminGroupsPanel initialGroups={initialGroups} />
      )}

      {activeTab === "globals" && <AdminGlobalPredictionsPanel />}
    </div>
  );
}

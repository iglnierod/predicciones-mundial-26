"use client";

import { LeaderboardProfile } from "@/types";
import { X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import GlobalTab from "./tabs/GlobalTab";
import GroupsTab from "./tabs/GroupsTab";
import MatchesTab from "./tabs/MatchesTab";
import CompareTab from "./tabs/CompareTab";

type Props = {
  profile: LeaderboardProfile;
  viewerUserId?: string;
  onClose: () => void;
};

type TabKey = "global" | "groups" | "matches" | "compare";

const tabs: { key: TabKey; label: string }[] = [
  { key: "global", label: "GLOBAL" },
  { key: "groups", label: "GRUPOS" },
  { key: "matches", label: "PARTIDOS" },
  { key: "compare", label: "COMPARAR" },
];

export default function UserBreakdownTabs({
  profile,
  viewerUserId,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("global");

  const isOwnProfile = viewerUserId === profile.user_id;

  const tabButtonClass = (isActive: boolean) =>
    isActive
      ? "rounded-full bg-[#2A398D] px-4 py-2 text-sm font-bold tracking-wide text-white shadow-sm transition"
      : "rounded-full border border-black/5 bg-white px-4 py-2 text-sm font-bold tracking-wide text-black/65 shadow-sm transition hover:bg-black/[0.03] hover:text-black";

  return (
    <div className="text-left text-black">
      <div className="overflow-hidden rounded-3xl border border-black/5 bg-white/85 shadow-[0_18px_48px_rgba(0,0,0,0.22)] ring-1 ring-white/30 backdrop-blur-sm">
        <div className="border-b border-black/5 bg-white/70 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="overflow-hidden rounded-full border border-black/5 bg-white shadow-sm">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name ?? "Usuario"}
                    width={60}
                    height={60}
                    className="h-14 w-14 object-cover sm:h-16 sm:w-16"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center text-lg font-extrabold text-black/55 sm:h-16 sm:w-16 sm:text-xl">
                    {profile.full_name?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#2A398D]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#2A398D]">
                    #{profile.rank}
                  </span>

                  <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-bold tracking-wide text-black/70">
                    {profile.total_points} puntos
                  </span>

                  {isOwnProfile && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-bold tracking-wide text-green-700">
                      TU PERFIL
                    </span>
                  )}
                </div>

                <h2 className="truncate text-xl font-extrabold text-black sm:text-2xl">
                  {profile.full_name ?? "Usuario sin nombre"}
                </h2>

                <p className="mt-1 text-sm text-black/55">
                  Grupos: {profile.group_points} · Partidos:{" "}
                  {profile.match_points} · Extras: {profile.extra_points}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-2xl border border-black/5 bg-white p-2 text-black/60 shadow-sm transition hover:bg-black/3 hover:text-black"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={tabButtonClass(activeTab === tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5">
          {activeTab === "global" && <GlobalTab profile={profile} />}
          {activeTab === "groups" && <GroupsTab profile={profile} />}
          {activeTab === "matches" && (
            <MatchesTab profile={profile} viewerUserId={viewerUserId} />
          )}
          {activeTab === "compare" && (
            <CompareTab
              profile={profile}
              viewerUserId={viewerUserId}
              isOwnProfile={isOwnProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { LeaderboardProfile } from "@/types";
import UserBreakdownTabs from "./user-breakdown-tabs";

const MySwal = withReactContent(Swal);

type Props = {
  profile: LeaderboardProfile;
  viewerUserId?: string;
};

export async function UserBreakdownModal({ profile, viewerUserId }: Props) {
  await MySwal.fire({
    width: 900,
    padding: 0,
    background: "transparent",
    showConfirmButton: false,
    showCloseButton: false,
    customClass: {
      popup: "rounded-[28px] overflow-hidden shadow-none bg-transparent",
      htmlContainer: "!m-0 !p-0",
    },
    html: (
      <UserBreakdownTabs
        profile={profile}
        viewerUserId={viewerUserId}
        onClose={() => Swal.close()}
      />
    ),
  });
}

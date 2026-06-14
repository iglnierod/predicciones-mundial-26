"use client";

import { useSyncExternalStore } from "react";
import { formatKickoffDateTime, parseUtcDate } from "@/lib/format/match";

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

type Props = {
  dateString: string;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
  placeholder?: string;
};

export default function LocalKickoffDateTime({
  dateString,
  options,
  className,
  placeholder = "--",
}: Props) {
  const hasMounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const dateTime = parseUtcDate(dateString).toISOString();
  const label = hasMounted
    ? formatKickoffDateTime(dateString, options)
    : placeholder;

  return (
    <time dateTime={dateTime} className={className}>
      {label}
    </time>
  );
}

export function parseUtcDate(dateString: string) {
  return new Date(dateString.replace(" ", "T"));
}

export function formatKickoffDateTime(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {},
) {
  const date = parseUtcDate(dateString);

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...options,
  }).format(date);
}

export function getPredictionCloseDate(kickoffAt: string) {
  const kickoffDate = parseUtcDate(kickoffAt);
  return new Date(kickoffDate.getTime() - 60 * 1000);
}

export function isPredictionClosed(kickoffAt: string) {
  return new Date() >= getPredictionCloseDate(kickoffAt);
}

export function getRoundLabel(round: string) {
  switch (round) {
    case "group":
      return "GRUPOS";
    case "R32":
      return "DIECISEISAVOS";
    case "R16":
      return "OCTAVOS";
    case "QF":
      return "CUARTOS DE FINAL";
    case "SF":
      return "SEMIFINALES";
    case "3r":
      return "3/4 PUESTO";
    case "final":
      return "FINAL";
    default:
      return round.toUpperCase();
  }
}

export function getMatchStatusLabel(status: string) {
  switch (status) {
    case "scheduled":
      return "PROGRAMADO";
    case "live":
      return "EN DIRECTO";
    case "completed":
      return "JUGADO";
    default:
      return status.toUpperCase();
  }
}

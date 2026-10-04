export interface BookingTheme {
  bg: string;
  border: string;
  text: string;
  iconColor: string;
  icon: string;
  subtext: string;
}

export const getBookingTheme = (indexOrTitle: number | string): BookingTheme => {
  const themes: BookingTheme[] = [
    {
      bg: "bg-blue-50/90 dark:bg-blue-950/40",
      border: "border-blue-200/80 dark:border-blue-800/60",
      text: "text-blue-900 dark:text-blue-100",
      iconColor: "text-blue-600 dark:text-blue-400",
      icon: "ri-team-line",
      subtext: "text-blue-600/80 dark:text-blue-300/80",
    },
    {
      bg: "bg-purple-50/90 dark:bg-purple-950/40",
      border: "border-purple-200/80 dark:border-purple-800/60",
      text: "text-purple-900 dark:text-purple-100",
      iconColor: "text-purple-600 dark:text-purple-400",
      icon: "ri-chat-voice-line",
      subtext: "text-purple-600/80 dark:text-purple-300/80",
    },
    {
      bg: "bg-emerald-50/90 dark:bg-emerald-950/40",
      border: "border-emerald-200/80 dark:border-emerald-800/60",
      text: "text-emerald-900 dark:text-emerald-100",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      icon: "ri-checkbox-circle-line",
      subtext: "text-emerald-600/80 dark:text-emerald-300/80",
    },
  ];

  if (typeof indexOrTitle === "number") {
    return themes[indexOrTitle % themes.length];
  }

  const lower = indexOrTitle.toLowerCase();
  if (lower.includes("team") || lower.includes("sync") || lower.includes("all hands")) {
    return themes[0];
  }
  if (lower.includes("project") || lower.includes("design") || lower.includes("marketing") || lower.includes("review")) {
    return themes[1];
  }
  if (lower.includes("client") || lower.includes("customer") || lower.includes("workshop") || lower.includes("presentation")) {
    return themes[2];
  }

  const hash = indexOrTitle.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return themes[Math.abs(hash) % themes.length];
};

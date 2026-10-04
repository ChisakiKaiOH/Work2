// Schermate raggiungibili dentro una partita. I gruppi della bottom nav
// mappano a una schermata "principale"; alcune schermate (newProject,
// development, gameDetails, saveLoad) si raggiungono navigando da un'altra
// e mostrano un pulsante "Indietro" verso il gruppo di provenienza.
export type Screen =
  | "dashboard"
  | "gameLibrary"
  | "newProject"
  | "development"
  | "gameDetails"
  | "employees"
  | "studio"
  | "office"
  | "technology"
  | "events"
  | "settings"
  | "saveLoad";

export type NavGroup = "dashboard" | "gameLibrary" | "employees" | "studio" | "events" | "settings";

export const NAV_ITEMS: { group: NavGroup; screen: Screen; label: string; icon: string }[] = [
  { group: "dashboard", screen: "dashboard", label: "Dashboard", icon: "🏠" },
  { group: "gameLibrary", screen: "gameLibrary", label: "Progetti", icon: "🎮" },
  { group: "employees", screen: "employees", label: "Team", icon: "👥" },
  { group: "studio", screen: "studio", label: "Studio", icon: "🏢" },
  { group: "events", screen: "events", label: "Eventi", icon: "📰" },
  { group: "settings", screen: "settings", label: "Impostazioni", icon: "⚙️" },
];

export function groupForScreen(screen: Screen): NavGroup {
  switch (screen) {
    case "newProject":
    case "development":
    case "gameDetails":
      return "gameLibrary";
    case "office":
    case "technology":
      return "studio";
    case "saveLoad":
      return "settings";
    default:
      return screen;
  }
}

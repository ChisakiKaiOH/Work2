import { useState } from "react";
import { GameProvider } from "./game/GameContext";
import { useGameState } from "./hooks/useGame";
import { NAV_ITEMS, groupForScreen, type Screen } from "./screens/navigation";

import MainMenuScreen from "./screens/MainMenuScreen";
import NewGameScreen from "./screens/NewGameScreen";
import DashboardScreen from "./screens/DashboardScreen";
import GameLibraryScreen from "./screens/GameLibraryScreen";
import NewProjectScreen from "./screens/NewProjectScreen";
import DevelopmentScreen from "./screens/DevelopmentScreen";
import GameDetailsScreen from "./screens/GameDetailsScreen";
import EmployeesScreen from "./screens/EmployeesScreen";
import StudioScreen from "./screens/StudioScreen";
import EventsScreen from "./screens/EventsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import SaveLoadScreen from "./screens/SaveLoadScreen";

import TopBar from "./components/TopBar";
import BottomNav from "./components/BottomNav";
import NotificationsStack from "./components/NotificationsStack";
import EventModal from "./components/EventModal";
import TutorialOverlay from "./components/TutorialOverlay";

import "./App.css";

type Stage = "menu" | "newGame" | "menuLoad" | "game";

function GameShell() {
  const state = useGameState();
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [saveLoadMode, setSaveLoadMode] = useState<"save" | "load">("save");
  const [stage, setStage] = useState<Stage>("menu");

  if (stage === "menu") {
    return (
      <MainMenuScreen
        onNewGame={() => setStage("newGame")}
        onLoad={() => {
          setSaveLoadMode("load");
          setStage("menuLoad");
        }}
      />
    );
  }

  if (stage === "newGame") {
    return (
      <NewGameScreen
        onStarted={() => {
          setScreen("dashboard");
          setStage("game");
        }}
        onBack={() => setStage("menu")}
      />
    );
  }

  if (stage === "menuLoad") {
    return (
      <SaveLoadScreen
        mode="load"
        onDone={() => {
          setScreen("dashboard");
          setStage("game");
        }}
        onBack={() => setStage("menu")}
      />
    );
  }

  const navGroup = groupForScreen(screen);

  function renderScreen() {
    switch (screen) {
      case "dashboard":
        return <DashboardScreen onNewProject={() => setScreen("newProject")} onOpenLibrary={() => setScreen("gameLibrary")} />;
      case "gameLibrary":
        return (
          <GameLibraryScreen
            onNewProject={() => setScreen("newProject")}
            onOpenDevelopment={(id) => {
              setSelectedProjectId(id);
              setScreen("development");
            }}
            onOpenGameDetails={(id) => {
              setSelectedGameId(id);
              setScreen("gameDetails");
            }}
          />
        );
      case "newProject":
        return <NewProjectScreen onCreated={() => setScreen("gameLibrary")} onBack={() => setScreen("gameLibrary")} />;
      case "development":
        return selectedProjectId ? (
          <DevelopmentScreen projectId={selectedProjectId} onBack={() => setScreen("gameLibrary")} />
        ) : (
          <GameLibraryScreen
            onNewProject={() => setScreen("newProject")}
            onOpenDevelopment={(id) => setSelectedProjectId(id)}
            onOpenGameDetails={(id) => {
              setSelectedGameId(id);
              setScreen("gameDetails");
            }}
          />
        );
      case "gameDetails":
        return selectedGameId ? (
          <GameDetailsScreen gameId={selectedGameId} onBack={() => setScreen("gameLibrary")} />
        ) : (
          <GameLibraryScreen
            onNewProject={() => setScreen("newProject")}
            onOpenDevelopment={(id) => {
              setSelectedProjectId(id);
              setScreen("development");
            }}
            onOpenGameDetails={(id) => setSelectedGameId(id)}
          />
        );
      case "employees":
        return <EmployeesScreen />;
      case "studio":
      case "office":
      case "technology":
        return <StudioScreen />;
      case "events":
        return <EventsScreen />;
      case "settings":
        return (
          <SettingsScreen
            onOpenSave={() => {
              setSaveLoadMode("save");
              setScreen("saveLoad");
            }}
            onMainMenu={() => setStage("menu")}
          />
        );
      case "saveLoad":
        return <SaveLoadScreen mode={saveLoadMode} onDone={() => setScreen("dashboard")} onBack={() => setScreen("settings")} />;
      default:
        return null;
    }
  }

  return (
    <div className="app-shell">
      <TopBar />
      <main className="app-main">{renderScreen()}</main>
      <BottomNav
        active={navGroup}
        onNavigate={(group) => {
          const item = NAV_ITEMS.find((i) => i.group === group);
          if (item) setScreen(item.screen);
        }}
      />
      <NotificationsStack />
      {state.activeEvent && <EventModal />}
      {state.tutorialStep != null && <TutorialOverlay />}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameShell />
    </GameProvider>
  );
}

import { useState } from 'react';
import { GameProvider } from './game/GameContext';
import { useGameState } from './game/hooks';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import NewGameScreen from './screens/NewGameScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import GarageScreen from './screens/GarageScreen';
import RaceScreen from './screens/RaceScreen';
import WorldScreen from './screens/WorldScreen';
import MoreScreen from './screens/MoreScreen';
import MarketScreen from './screens/MarketScreen';
import PacksScreen from './screens/PacksScreen';
import CollectionScreen from './screens/CollectionScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import SettingsScreen from './screens/SettingsScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import type { Screen, RaceLaunch } from './screens/navigation';
import './App.css';

function GameShell() {
  const player = useGameState();
  const [screen, setScreen] = useState<Screen>('home');
  const [raceLaunch, setRaceLaunch] = useState<RaceLaunch | undefined>(undefined);

  if (!player) return <NewGameScreen />;
  if (!player.firstCarChosen || !player.tutorialCompleted) return <OnboardingScreen player={player} />;

  const goTo = (target: Screen) => {
    setRaceLaunch(undefined);
    setScreen(target);
  };
  const goToRace = (launch: RaceLaunch) => {
    setRaceLaunch(launch);
    setScreen('race');
  };

  return (
    <div className="app-shell">
      <TopBar player={player} />
      <main className="app-content">
        {screen === 'home' && <HomeScreen onNavigate={goTo} />}
        {screen === 'garage' && <GarageScreen />}
        {screen === 'race' && <RaceScreen launch={raceLaunch} />}
        {screen === 'world' && <WorldScreen onRace={goToRace} />}
        {screen === 'more' && <MoreScreen onNavigate={goTo} />}
        {screen === 'market' && <MarketScreen onBack={() => goTo('more')} />}
        {screen === 'packs' && <PacksScreen onBack={() => goTo('more')} />}
        {screen === 'collection' && <CollectionScreen onBack={() => goTo('more')} />}
        {screen === 'achievements' && <AchievementsScreen onBack={() => goTo('more')} />}
        {screen === 'settings' && <SettingsScreen onBack={() => goTo('more')} />}
        {screen === 'leaderboard' && <LeaderboardScreen onBack={() => goTo('more')} />}
      </main>
      <BottomNav active={screen} onSelect={goTo} />
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

import { useState } from 'react';
import { GameProvider } from './game/GameContext';
import { useGameState } from './game/hooks';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import NewCareerScreen from './screens/NewCareerScreen';
import HomeScreen from './screens/HomeScreen';
import GarageScreen from './screens/GarageScreen';
import DriversScreen from './screens/DriversScreen';
import MarketScreen from './screens/MarketScreen';
import TeamScreen from './screens/TeamScreen';
import RaceScreen from './screens/RaceScreen';
import AuctionScreen from './screens/AuctionScreen';
import type { Screen, EventScreen } from './screens/navigation';
import './App.css';

function GameShell() {
  const player = useGameState();
  const [screen, setScreen] = useState<Screen>('home');
  const [eventScreen, setEventScreen] = useState<EventScreen | null>(null);

  if (!player) return <NewCareerScreen />;

  if (eventScreen === 'race') return <RaceScreen onFinish={() => setEventScreen(null)} />;
  if (eventScreen === 'auction') return <AuctionScreen onFinish={() => setEventScreen(null)} />;

  return (
    <div className="app-shell">
      <TopBar player={player} />
      <main className="app-content">
        {screen === 'home' && <HomeScreen onOpenEvent={setEventScreen} />}
        {screen === 'garage' && <GarageScreen />}
        {screen === 'drivers' && <DriversScreen />}
        {screen === 'market' && <MarketScreen />}
        {screen === 'team' && <TeamScreen />}
      </main>
      <BottomNav active={screen} onSelect={setScreen} />
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

export type Screen = 'home' | 'garage' | 'drivers' | 'market' | 'team';

/** Full-screen event overlays triggered from the Home "next event" card — not bottom-nav tabs. */
export type EventScreen = 'race' | 'auction';

export const BOTTOM_NAV: { screen: Screen; label: string; icon: string }[] = [
  { screen: 'home', label: 'Home', icon: '⌂' },
  { screen: 'garage', label: 'Garage', icon: '◧' },
  { screen: 'drivers', label: 'Piloti', icon: '☺' },
  { screen: 'market', label: 'Mercato', icon: '⇄' },
  { screen: 'team', label: 'Squadra', icon: '▤' },
];

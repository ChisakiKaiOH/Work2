import { BOTTOM_NAV, type Screen } from '../screens/navigation';

interface BottomNavProps {
  active: Screen;
  onSelect: (screen: Screen) => void;
}

export default function BottomNav({ active, onSelect }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {BOTTOM_NAV.map(item => (
        <button
          key={item.screen}
          type="button"
          className={['bottom-nav-item', active === item.screen ? 'active' : ''].filter(Boolean).join(' ')}
          onClick={() => onSelect(item.screen)}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

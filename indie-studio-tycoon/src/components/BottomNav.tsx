import { NAV_ITEMS, type NavGroup } from "../screens/navigation";

export default function BottomNav({ active, onNavigate }: { active: NavGroup; onNavigate: (group: NavGroup) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Navigazione principale">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.group}
          type="button"
          className={active === item.group ? "bottom-nav-btn bottom-nav-btn-active" : "bottom-nav-btn"}
          onClick={() => onNavigate(item.group)}
          aria-current={active === item.group ? "page" : undefined}
        >
          <span className="bottom-nav-icon" aria-hidden="true">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

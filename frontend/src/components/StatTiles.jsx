import { formatNumber, platformLabel } from '../platforms.js';

export default function StatTiles({ overview }) {
  if (!overview) return null;
  const platforms = Object.entries(overview.byPlatform ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="stat-grid">
      <div className="stat-tile">
        <div className="label">Account monitorati</div>
        <div className="value">{overview.accounts}</div>
      </div>
      <div className="stat-tile">
        <div className="label">Follower totali</div>
        <div className="value">{formatNumber(overview.followers)}</div>
      </div>
      {platforms.slice(0, 3).map(([platform, followers]) => (
        <div className="stat-tile" key={platform}>
          <div className="label">{platformLabel(platform)}</div>
          <div className="value">{formatNumber(followers)}</div>
          <div className="sub">follower</div>
        </div>
      ))}
    </div>
  );
}

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { platformColor, platformLabel, formatNumber } from '../platforms.js';

function formatDate(iso) {
  const normalized = iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`;
  return new Date(normalized).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
  });
}

export default function AccountCard({ account, onRefresh, onDelete, onExpand, expanded, snapshots, posts }) {
  const [busy, setBusy] = useState(false);
  const color = platformColor(account.platform);
  const latest = account.latest;

  async function handleRefresh() {
    setBusy(true);
    try {
      await onRefresh(account.id);
    } finally {
      setBusy(false);
    }
  }

  const chartData = (snapshots ?? []).map((s) => ({
    date: formatDate(s.captured_at),
    followers: s.followers,
  }));

  return (
    <div>
      <div className="account-card">
        <div className="account-identity">
          <span className="platform-dot" style={{ background: color }} />
          <div>
            <div className="name">{account.display_name || account.handle}</div>
            <div className="meta">
              {platformLabel(account.platform)} · @{account.handle}{' '}
              <span className={`badge ${account.is_live ? 'live' : ''}`}>
                {account.is_live ? 'dati reali' : 'demo'}
              </span>
            </div>
          </div>
        </div>

        <div className="account-metrics">
          <div>
            <b>{formatNumber(latest?.followers)}</b>
            follower
          </div>
          <div>
            <b>{latest?.engagement_rate != null ? `${latest.engagement_rate}%` : '—'}</b>
            engagement
          </div>
        </div>

        <div className="account-actions">
          <button className="secondary" onClick={() => onExpand(account.id)}>
            {expanded ? 'Chiudi' : 'Dettagli'}
          </button>
          <button className="secondary" onClick={handleRefresh} disabled={busy}>
            {busy ? '…' : 'Aggiorna'}
          </button>
          <button className="danger" onClick={() => onDelete(account.id)}>
            Rimuovi
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '4px 0 20px' }}>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--gridline)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={{ stroke: 'var(--baseline)' }} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} width={50} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                  formatter={(value) => [formatNumber(value), 'Follower']}
                />
                <Line type="monotone" dataKey="followers" stroke={color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-state">Serve almeno un secondo aggiornamento per vedere il trend.</p>
          )}

          <h3 style={{ fontSize: 13, color: 'var(--text-muted)', margin: '12px 0 8px' }}>Post recenti</h3>
          {posts?.length ? (
            <div className="post-list">
              {posts.map((p) => (
                <div className="post-item" key={p.id}>
                  <div>{p.content || <em>(nessun testo)</em>}</div>
                  <div className="post-meta">
                    <span>{formatNumber(p.likes)} like</span>
                    <span>{formatNumber(p.comments)} commenti</span>
                    <span>{formatNumber(p.shares)} condivisioni</span>
                    {p.published_at && <span>{formatDate(p.published_at)}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">Nessun post ancora. Premi "Aggiorna" per recuperarli.</p>
          )}
        </div>
      )}
    </div>
  );
}

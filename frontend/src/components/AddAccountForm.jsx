import { useState } from 'react';
import { platformLabel } from '../platforms.js';

export default function AddAccountForm({ platforms, onAdd }) {
  const [platform, setPlatform] = useState(platforms[0]?.platform ?? 'twitter');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!handle.trim()) return;
    setSubmitting(true);
    try {
      await onAdd({ platform, handle: handle.trim(), display_name: displayName.trim() });
      setHandle('');
      setDisplayName('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
        {platforms.map((p) => (
          <option key={p.platform} value={p.platform}>
            {platformLabel(p.platform)} {p.live ? '' : '(demo)'}
          </option>
        ))}
      </select>
      <input
        placeholder="Handle / username / ID"
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
      />
      <input
        placeholder="Nome visualizzato (opzionale)"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <button type="submit" disabled={submitting || !handle.trim()}>
        {submitting ? 'Aggiungo…' : 'Aggiungi account'}
      </button>
    </form>
  );
}

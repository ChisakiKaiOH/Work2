import { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import StatTiles from './components/StatTiles.jsx';
import AddAccountForm from './components/AddAccountForm.jsx';
import AccountCard from './components/AccountCard.jsx';

export default function App() {
  const [platforms, setPlatforms] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [overview, setOverview] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedData, setExpandedData] = useState({ snapshots: [], posts: [] });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [platformsRes, accountsRes, overviewRes] = await Promise.all([
      api.getPlatforms(),
      api.getAccounts(),
      api.getOverview(),
    ]);
    setPlatforms(platformsRes);
    setAccounts(accountsRes);
    setOverview(overviewRes);
  }, []);

  useEffect(() => {
    loadAll()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadAll]);

  async function withErrorHandling(fn) {
    try {
      setError(null);
      await fn();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAdd(payload) {
    await withErrorHandling(async () => {
      await api.addAccount(payload);
      await loadAll();
    });
  }

  async function handleDelete(id) {
    await withErrorHandling(async () => {
      await api.deleteAccount(id);
      if (expandedId === id) setExpandedId(null);
      await loadAll();
    });
  }

  async function handleRefresh(id) {
    await withErrorHandling(async () => {
      await api.refreshAccount(id);
      await loadAll();
      if (expandedId === id) await loadExpanded(id);
    });
  }

  async function loadExpanded(id) {
    const [snapshots, posts] = await Promise.all([api.getSnapshots(id), api.getPosts(id)]);
    setExpandedData({ snapshots, posts });
  }

  async function handleExpand(id) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    await withErrorHandling(() => loadExpanded(id));
  }

  return (
    <div>
      <div className="header">
        <div>
          <h1>Social Monitor</h1>
          <p>Tieni sotto controllo tutti i tuoi account social da un unico posto.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!loading && <StatTiles overview={overview} />}

      <div className="panel">
        <h2>Aggiungi un account</h2>
        <AddAccountForm platforms={platforms} onAdd={handleAdd} />
      </div>

      <div className="panel">
        <h2>Account monitorati</h2>
        {accounts.length === 0 && !loading && (
          <p className="empty-state">Nessun account ancora. Aggiungine uno qui sopra per iniziare.</p>
        )}
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            expanded={expandedId === account.id}
            snapshots={expandedId === account.id ? expandedData.snapshots : []}
            posts={expandedId === account.id ? expandedData.posts : []}
            onExpand={handleExpand}
            onRefresh={handleRefresh}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

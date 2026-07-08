import React, { useState, useEffect, useCallback } from 'react';
import TerminalView from './TerminalView';
import SandboxCard from './components/SandboxCard';
import SandboxDetailModal from './components/SandboxDetailModal';
import SearchBar from './components/SearchBar';

function App() {
  const [sandboxes, setSandboxes] = useState([]);
  const [activeSandbox, setActiveSandbox] = useState(null);
  const [selectedSandbox, setSelectedSandbox] = useState(null);
  const [searchPrefix, setSearchPrefix] = useState('');
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

  const fetchSandboxes = useCallback(async (prefix = '') => {
    try {
      const params = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
      const res = await fetch(`${BACKEND_URL}/api/sandboxes${params}`);
      const data = await res.json();
      setSandboxes(data.sandboxes);
    } catch (err) {
      console.error('Failed to fetch sandboxes', err);
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    fetchSandboxes(searchPrefix);
  }, [fetchSandboxes, searchPrefix]);

  const createSandbox = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/sandboxes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Sprite-' + Math.floor(Math.random() * 1000) })
      });
      const data = await res.json();
      if (data.sandbox) {
        setSandboxes([...sandboxes, data.sandbox]);
      }
    } catch (err) {
      console.error('Failed to create sandbox', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSandbox = async (sandbox) => {
    if (!confirm(`Delete sandbox "${sandbox.name}"? This cannot be undone.`)) return;

    try {
      await fetch(`${BACKEND_URL}/api/sandboxes/${sandbox.name}`, {
        method: 'DELETE'
      });
      setSandboxes(sandboxes.filter(sb => sb.name !== sandbox.name));
    } catch (err) {
      console.error('Failed to delete sandbox', err);
      alert('Failed to delete sandbox: ' + err.message);
    }
  };

  if (activeSandbox) {
    return (
      <div className="w-screen h-[100dvh] overflow-hidden">
        <TerminalView sandbox={activeSandbox} onExit={() => setActiveSandbox(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <header className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sprites-accent to-sprites-cyan tracking-tight">
            Sprites Sandboxes
          </h1>
          <p className="text-gray-400 mt-2 text-sm font-medium">Stateful micro-VMs with instant terminal access</p>
        </div>

        <div className="flex items-center gap-3">
          <SearchBar value={searchPrefix} onChange={setSearchPrefix} />
          <button
            onClick={createSandbox}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-sprites-accent hover:bg-purple-600 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(124,58,237,0.35)] transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Provisioning...
              </span>
            ) : (
              '+ New Sandbox'
            )}
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sandboxes.map(sb => (
          <SandboxCard
            key={sb.name}
            sandbox={sb}
            onConnect={setActiveSandbox}
            onDelete={deleteSandbox}
            onDetails={setSelectedSandbox}
          />
        ))}

        {sandboxes.length === 0 && !loading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-800 rounded-2xl bg-sprites-panel/30">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-800/50 flex items-center justify-center text-2xl">🖥️</div>
            <h3 className="text-lg font-medium text-gray-300">
              {searchPrefix ? 'No sandboxes found' : 'No active sandboxes'}
            </h3>
            <p className="text-gray-500 mt-2 max-w-sm">
              {searchPrefix
                ? `No sandboxes match prefix "${searchPrefix}"`
                : 'Create your first sandbox to get instant access to a stateful execution environment.'}
            </p>
          </div>
        )}
      </main>

      <SandboxDetailModal sandbox={selectedSandbox} onClose={() => setSelectedSandbox(null)} />
    </div>
  );
}

export default App;

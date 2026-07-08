import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TerminalView from '../TerminalView';
import SandboxCard from '../components/SandboxCard';
import SandboxDetailModal from '../components/SandboxDetailModal';
import SearchBar from '../components/SearchBar';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';

export default function DashboardPage() {
  const { user, logout, githubStatus } = useAuth();
  const navigate = useNavigate();
  const api = useApi();
  const [sandboxes, setSandboxes] = useState([]);
  const [activeSandbox, setActiveSandbox] = useState(null);
  const [selectedSandbox, setSelectedSandbox] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchPrefix, setSearchPrefix] = useState('');
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef(null);

  const fetchSandboxes = useCallback(async (prefix = '') => {
    try {
      const params = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
      const res = await api.get(`/api/sandboxes${params}`);
      const data = await res.json();
      setSandboxes(data.sandboxes || []);
    } catch (err) {
      console.error('Failed to fetch sandboxes', err);
    }
  }, [api]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchPrefix(searchInput);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  useEffect(() => {
    fetchSandboxes(searchPrefix);
  }, [fetchSandboxes, searchPrefix]);

  const createSandbox = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/sandboxes', { name: 'Sprite-' + Math.floor(Math.random() * 1000) });
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
      await api.del(`/api/sandboxes/${sandbox.name}`);
      setSandboxes(sandboxes.filter((sb) => sb.name !== sandbox.name));
    } catch (err) {
      console.error('Failed to delete sandbox', err);
      alert('Failed to delete sandbox: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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

        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar value={searchInput} onChange={setSearchInput} />
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
          <Link
            to="/settings"
            className="flex items-center gap-2 px-4 py-2.5 bg-sprites-panel border border-gray-700 hover:border-sprites-accent/50 text-gray-200 font-medium rounded-lg transition-all"
            title="Settings & GitHub connection"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <div className="flex items-center gap-3 pl-3 border-l border-gray-700">
            <span className="text-sm text-gray-400 hidden sm:inline">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors bg-gray-800 hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sandboxes.map((sb) => (
          <SandboxCard
            key={sb.name}
            sandbox={sb}
            onConnect={setActiveSandbox}
            onDelete={deleteSandbox}
            onDetails={setSelectedSandbox}
            githubConnected={githubStatus.connected}
          />
        ))}

        {sandboxes.length === 0 && !loading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-800 rounded-2xl bg-sprites-panel/30">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-800/50 flex items-center justify-center text-2xl">🖥️</div>
            <h3 className="text-lg font-medium text-gray-300">
              {searchInput ? 'No sandboxes found' : 'No active sandboxes'}
            </h3>
            <p className="text-gray-500 mt-2 max-w-sm">
              {searchInput
                ? `No sandboxes match prefix "${searchInput}"`
                : 'Create your first sandbox to get instant access to a stateful execution environment.'}
            </p>
          </div>
        )}
      </main>

      <SandboxDetailModal sandbox={selectedSandbox} onClose={() => setSelectedSandbox(null)} githubConnected={githubStatus.connected} />
    </div>
  );
}

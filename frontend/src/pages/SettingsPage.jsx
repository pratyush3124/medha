import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';

export default function SettingsPage() {
  const { user, logout, githubStatus, fetchGithubStatus, startGithubPolling, stopGithubPolling } = useAuth();
  const navigate = useNavigate();
  const api = useApi();
  const [oauthPending, setOauthPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => stopGithubPolling();
  }, [stopGithubPolling]);

  const handleConnectGithub = async () => {
    setError('');
    try {
      const res = await api.post('/api/oauth/github/initiate');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate OAuth');

      sessionStorage.setItem('oauth_state', data.state);
      window.open(data.authorize_url, '_blank');
      setOauthPending(true);
      startGithubPolling(data.state, () => {
        setOauthPending(false);
        sessionStorage.removeItem('oauth_state');
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelOauth = () => {
    stopGithubPolling();
    setOauthPending(false);
    sessionStorage.removeItem('oauth_state');
  };

  const handleDisconnect = async (connId) => {
    if (!confirm('Disconnect GitHub? Your sandboxes will lose GitHub access.')) return;
    try {
      await api.del(`/api/oauth/github/connections/${connId}`);
      await fetchGithubStatus();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const parseScopes = (scopesStr) => {
    try {
      return JSON.parse(scopesStr || '[]');
    } catch {
      return [];
    }
  };

  const { active, connected, loading: ghLoading } = githubStatus;

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-sprites-panel border border-gray-700 hover:border-sprites-accent/50 text-gray-200 font-medium rounded-lg transition-all text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="space-y-6">
          <div className="bg-sprites-panel border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Email</label>
                <p className="text-gray-300 mt-1">{user?.email}</p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Sprite Label</label>
                <p className="text-gray-300 mt-1 font-mono text-sm">{user?.sprite_label}</p>
              </div>
              <button
                onClick={handleLogout}
                className="mt-2 px-4 py-2 bg-gray-800 hover:bg-red-600/80 text-gray-300 hover:text-white rounded-lg text-sm transition-all"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="bg-sprites-panel border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">GitHub Connection</h2>

            {ghLoading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-4 h-4 border-2 border-gray-700 border-t-sprites-accent rounded-full animate-spin"></span>
                Loading...
              </div>
            ) : connected && active ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.37 1.23-3.21-.12-.3-.54-1.515.12-3.15 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.635.24 2.85.12 3.15.765.84 1.23 1.905 1.23 3.21 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {active.github_username ? `@${active.github_username}` : 'GitHub connected'}
                    </p>
                    <p className="text-gray-500 text-xs">Connected on {formatDate(active.confirmedAt)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Scopes</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {parseScopes(active.scopes).map((scope) => (
                      <span key={scope} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md border border-gray-700">
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-black/30 border border-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400">
                    Your sandboxes can now access GitHub through the Sprites gateway. The coding agent inside
                    each sandbox will automatically detect and use this connection.
                  </p>
                </div>

                <button
                  onClick={() => handleDisconnect(active.id)}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 rounded-lg text-sm transition-all"
                >
                  Disconnect GitHub
                </button>
              </div>
            ) : oauthPending ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="w-4 h-4 border-2 border-gray-700 border-t-sprites-accent rounded-full animate-spin"></span>
                  <div>
                    <p className="font-medium">Waiting for GitHub authorization...</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Complete the authorization in the tab that just opened. This page will update automatically.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancelOauth}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">
                    Connect your GitHub account so your sandboxes can access your repositories, issues, and pull
                    requests through the Sprites gateway. You only need to do this once — your sandboxes will
                    automatically pick up the connection.
                  </p>
                </div>
                <button
                  onClick={handleConnectGithub}
                  className="flex items-center gap-3 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all border border-gray-700 hover:border-gray-600"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.37 1.23-3.21-.12-.3-.54-1.515.12-3.15 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.635.24 2.85.12 3.15.765.84 1.23 1.905 1.23 3.21 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Connect GitHub
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

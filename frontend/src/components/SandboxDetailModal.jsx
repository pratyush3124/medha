import React from 'react';

export default function SandboxDetailModal({ sandbox, onClose, githubConnected }) {
  if (!sandbox) return null;

  const isRunning = sandbox.status === 'running';

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-sprites-panel border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Sandbox Details</h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Name</label>
            <p className="text-white font-mono text-sm mt-1">{sandbox.name}</p>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Status</label>
            <div className="mt-1">
              <span className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold px-2 py-1 rounded ${
                isRunning
                  ? 'text-sprites-cyan bg-sprites-cyan/10'
                  : 'text-gray-400 bg-gray-700/50'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-sprites-cyan animate-pulse' : 'bg-gray-500'}`}></span>
                {sandbox.status}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">ID</label>
            <p className="text-gray-300 font-mono text-sm mt-1">{sandbox.id || 'N/A'}</p>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Organization</label>
            <p className="text-gray-300 text-sm mt-1">{sandbox.organization || 'N/A'}</p>
          </div>

          {sandbox.url && (
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">URL</label>
              <a
                href={sandbox.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sprites-accent hover:text-purple-400 font-mono text-sm mt-1 break-all"
              >
                {sandbox.url}
              </a>
            </div>
          )}

          {sandbox.ip && (
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">IP / Host</label>
              <p className="text-gray-300 font-mono text-sm mt-1">{sandbox.ip}</p>
            </div>
          )}

          <div>
            <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Created</label>
            <p className="text-gray-300 text-sm mt-1">{formatDate(sandbox.createdAt)}</p>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">GitHub Access</label>
            <div className="mt-2">
              {githubConnected ? (
                <span className="inline-flex items-center gap-2 text-sm text-sprites-cyan bg-sprites-cyan/10 px-3 py-1.5 rounded-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.37 1.23-3.21-.12-.3-.54-1.515.12-3.15 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.635.24 2.85.12 3.15.765.84 1.23 1.905 1.23 3.21 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Available via Sprites Gateway
                </span>
              ) : (
                <span className="text-sm text-gray-500">Not connected — link GitHub in Settings</span>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Updated</label>
            <p className="text-gray-300 text-sm mt-1">{formatDate(sandbox.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

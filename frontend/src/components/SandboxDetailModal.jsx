import React from 'react';

export default function SandboxDetailModal({ sandbox, onClose }) {
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
            <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Updated</label>
            <p className="text-gray-300 text-sm mt-1">{formatDate(sandbox.updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

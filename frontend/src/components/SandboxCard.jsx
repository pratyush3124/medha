import React from 'react';

export default function SandboxCard({ sandbox, onConnect, onDelete, onDetails }) {
  const isRunning = sandbox.status === 'running';

  return (
    <div
      className="group bg-sprites-panel border border-gray-800 hover:border-sprites-accent/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between h-52"
    >
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-sprites-accent/30 rounded-full blur-[40px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-0"></div>

      <div className="relative z-10 cursor-pointer" onClick={() => onDetails(sandbox)}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-semibold text-lg text-white leading-tight">{sandbox.name}</h3>
          <span className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded shadow-sm ${
            isRunning
              ? 'text-sprites-cyan bg-sprites-cyan/10 shadow-sprites-cyan/10'
              : 'text-gray-400 bg-gray-700/50 shadow-gray-900/10'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-sprites-cyan animate-pulse' : 'bg-gray-500'}`}></span>
            {sandbox.status}
          </span>
        </div>
        <p className="text-gray-500 text-xs font-mono">{sandbox.id}</p>
        {sandbox.ip && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-md border border-gray-800">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="text-gray-400 text-xs font-mono">{sandbox.ip}</span>
          </div>
        )}
      </div>

      <div className="relative z-10 flex gap-2 mt-5">
        <button
          onClick={(e) => { e.stopPropagation(); onConnect(sandbox); }}
          className="flex-1 py-2.5 bg-gray-800/80 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-semibold transition-all group-hover:bg-sprites-accent group-hover:text-white"
        >
          Connect Terminal →
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(sandbox); }}
          className="py-2.5 px-3 bg-gray-800/80 hover:bg-red-600/80 text-gray-400 hover:text-white rounded-lg text-sm transition-all"
          title="Delete sandbox"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

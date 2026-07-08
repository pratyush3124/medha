import React, { useState, useEffect } from 'react';
import TerminalView from './TerminalView';

function App() {
  const [sandboxes, setSandboxes] = useState([]);
  const [activeSandbox, setActiveSandbox] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSandboxes = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/sandboxes');
      const data = await res.json();
      setSandboxes(data.sandboxes);
    } catch (err) {
      console.error('Failed to fetch sandboxes', err);
    }
  };

  useEffect(() => {
    fetchSandboxes();
  }, []);

  const createSandbox = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/sandboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Sprite-' + Math.floor(Math.random() * 1000) })
      });
      const data = await res.json();
      setSandboxes([...sandboxes, data.sandbox]);
    } catch (err) {
      console.error('Failed to create sandbox', err);
    } finally {
      setLoading(false);
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
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sandboxes.map(sb => (
          <div 
            key={sb.id} 
            className="group bg-sprites-panel border border-gray-800 hover:border-sprites-accent/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between h-52"
          >
            {/* Ambient glow effect on hover */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-sprites-accent/30 rounded-full blur-[40px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-0"></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-lg text-white leading-tight">{sb.name}</h3>
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-sprites-cyan bg-sprites-cyan/10 px-2 py-1 rounded shadow-sm shadow-sprites-cyan/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-sprites-cyan animate-pulse"></span>
                  {sb.status}
                </span>
              </div>
              <p className="text-gray-500 text-xs font-mono">{sb.id}</p>
              {sb.ip && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-md border border-gray-800">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span className="text-gray-400 text-xs font-mono">{sb.ip}</span>
                </div>
              )}
            </div>

            <button 
              onClick={() => setActiveSandbox(sb)}
              className="relative z-10 w-full mt-5 py-2.5 bg-gray-800/80 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-semibold transition-all group-hover:bg-sprites-accent group-hover:text-white"
            >
              Connect Terminal →
            </button>
          </div>
        ))}

        {sandboxes.length === 0 && !loading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-800 rounded-2xl bg-sprites-panel/30">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-800/50 flex items-center justify-center text-2xl">🖥️</div>
            <h3 className="text-lg font-medium text-gray-300">No active sandboxes</h3>
            <p className="text-gray-500 mt-2 max-w-sm">Create your first sandbox to get instant access to a stateful execution environment.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

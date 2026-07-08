import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export default function TerminalView({ sandbox, onExit }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"Fira Code", monospace',
      fontSize: 14,
      theme: {
        background: '#0F1115',
        foreground: '#D1D5DB', // gray-300
        cursor: '#34D399', // sprites-cyan
        selection: '#4B5563', // gray-600
        black: '#000000',
        red: '#EF4444',
        green: '#10B981',
        yellow: '#F59E0B',
        blue: '#3B82F6',
        magenta: '#8B5CF6',
        cyan: '#06B6D4',
        white: '#FFFFFF'
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    
    // Fit might need a tiny delay to measure correctly in flex layout
    setTimeout(() => fitAddon.fit(), 10);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect to WebSocket
    // Hardcoding localhost:3001 for now, in prod it would be dynamic
    const ws = new WebSocket(`ws://localhost:3001/ws/terminal?spriteName=${sandbox.name}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onclose = () => {
      term.write('\r\n\x1b[31mConnection closed.\x1b[0m\r\n');
    };

    ws.onerror = (err) => {
      term.write('\r\n\x1b[31mConnection error.\x1b[0m\r\n');
      console.error(err);
    };

    // Handle user input in terminal -> send to WS
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Handle Resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.close();
      term.dispose();
    };
  }, [sandbox]);

  // Mobile specific helper function
  const sendKey = (key) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(key);
      xtermRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full bg-sprites-dark relative">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-sprites-panel border-b border-gray-800">
        <div className="flex items-center gap-2 text-sm font-medium">
          <div className="w-2.5 h-2.5 rounded-full bg-sprites-cyan animate-pulse"></div>
          <span className="text-gray-200">{sandbox.name}</span>
          <span className="hidden sm:inline text-gray-500 font-mono text-xs ml-2">{sandbox.ip}</span>
        </div>
        <button 
          onClick={onExit}
          className="text-gray-400 hover:text-white px-3 py-1 rounded text-sm transition-colors bg-gray-800 hover:bg-gray-700"
        >
          Exit
        </button>
      </div>

      {/* Terminal Container */}
      <div className="flex-1 overflow-hidden p-2 relative" ref={terminalRef}></div>

      {/* Mobile Helper Keyboard (shown only on small screens) */}
      <div className="md:hidden flex overflow-x-auto p-2 gap-2 bg-sprites-panel border-t border-gray-800 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
        <kbd onClick={() => sendKey('\x1b')} className="px-3 py-2 bg-gray-800 rounded-lg text-sm active:bg-gray-700 select-none cursor-pointer border border-gray-700 shadow-sm flex-shrink-0">ESC</kbd>
        <kbd onClick={() => sendKey('\t')} className="px-3 py-2 bg-gray-800 rounded-lg text-sm active:bg-gray-700 select-none cursor-pointer border border-gray-700 shadow-sm flex-shrink-0">TAB</kbd>
        <kbd onClick={() => sendKey('\x03')} className="px-3 py-2 bg-gray-800 rounded-lg text-sm active:bg-gray-700 select-none cursor-pointer font-bold text-red-400 border border-gray-700 shadow-sm flex-shrink-0">Ctrl+C</kbd>
        <div className="w-px bg-gray-700 mx-1 flex-shrink-0"></div>
        <kbd onClick={() => sendKey('\x1b[A')} className="px-3 py-2 bg-gray-800 rounded-lg text-sm active:bg-gray-700 select-none cursor-pointer border border-gray-700 shadow-sm flex-shrink-0">↑</kbd>
        <kbd onClick={() => sendKey('\x1b[B')} className="px-3 py-2 bg-gray-800 rounded-lg text-sm active:bg-gray-700 select-none cursor-pointer border border-gray-700 shadow-sm flex-shrink-0">↓</kbd>
        <kbd onClick={() => sendKey('\x1b[C')} className="px-3 py-2 bg-gray-800 rounded-lg text-sm active:bg-gray-700 select-none cursor-pointer border border-gray-700 shadow-sm flex-shrink-0">→</kbd>
        <kbd onClick={() => sendKey('\x1b[D')} className="px-3 py-2 bg-gray-800 rounded-lg text-sm active:bg-gray-700 select-none cursor-pointer border border-gray-700 shadow-sm flex-shrink-0">←</kbd>
      </div>
    </div>
  );
}

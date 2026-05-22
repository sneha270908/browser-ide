import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal as TerminalIcon, X, Minus, Plus, Loader2 } from 'lucide-react';
import { packagesAPI } from '../../lib/api';
import { useProjectStore } from '../../store';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const PROMPT = '$ ';

const builtinCommands = {
  clear: () => [],
  help: () => [
    { type: 'info', text: 'Available commands:' },
    { type: 'output', text: '  npm install <pkg>   Install an npm package' },
    { type: 'output', text: '  npm uninstall <pkg> Remove an npm package' },
    { type: 'output', text: '  ls                  List project files' },
    { type: 'output', text: '  clear               Clear terminal' },
    { type: 'output', text: '  help                Show this help' },
  ],
};

export default function TerminalPanel() {
  const [lines, setLines] = useState([
    { type: 'info', text: 'CodeForge Terminal v1.0.0' },
    { type: 'muted', text: 'Type "help" for available commands.' },
    { type: 'muted', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();
  const { currentProject } = useProjectStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const addLines = (newLines) =>
    setLines(prev => [...prev, ...newLines]);

  const runCommand = async (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Add command to display
    addLines([{ type: 'command', text: PROMPT + trimmed }]);

    // Add to history
    setHistory(h => [trimmed, ...h.slice(0, 49)]);
    setHistoryIdx(-1);

    // ── Builtin commands ──────────────────────
    if (trimmed === 'clear') {
      setLines([]);
      return;
    }

    if (trimmed === 'help') {
      addLines(builtinCommands.help());
      return;
    }

    if (trimmed === 'ls') {
      const files = currentProject?.files.map(f => f.path) || [];
      addLines(files.length
        ? files.map(p => ({ type: 'output', text: p }))
        : [{ type: 'muted', text: '(empty)' }]
      );
      return;
    }

    // ── npm install ───────────────────────────
    const installMatch = trimmed.match(/^npm install (.+)/);
    if (installMatch) {
      const pkgName = installMatch[1].trim();
      setLoading(true);
      addLines([{ type: 'muted', text: `Installing ${pkgName}...` }]);
      try {
        const { package: pkg } = await packagesAPI.install(currentProject._id, pkgName);
        addLines([
          { type: 'success', text: `+ ${pkg.name}@${pkg.version}` },
          { type: 'success', text: 'added 1 package ✓' },
        ]);
        toast.success(`Installed ${pkg.name}`);
      } catch (err) {
        addLines([{ type: 'error', text: `npm ERR! ${err.message}` }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── npm uninstall ─────────────────────────
    const uninstallMatch = trimmed.match(/^npm uninstall (.+)/);
    if (uninstallMatch) {
      const pkgName = uninstallMatch[1].trim();
      setLoading(true);
      try {
        await packagesAPI.uninstall(currentProject._id, pkgName);
        addLines([{ type: 'success', text: `removed ${pkgName} ✓` }]);
        toast.success(`Removed ${pkgName}`);
      } catch (err) {
        addLines([{ type: 'error', text: `npm ERR! ${err.message}` }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Unknown command
    addLines([
      { type: 'error', text: `command not found: ${trimmed.split(' ')[0]}` },
      { type: 'muted', text: 'Type "help" for available commands.' },
    ]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      runCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(idx);
      setInput(history[idx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(idx);
      setInput(idx === -1 ? '' : history[idx]);
    }
  };

  const lineColors = {
    command: 'text-forge-text',
    output: 'text-forge-subtle',
    info: 'text-forge-cyan',
    success: 'text-forge-emerald',
    error: 'text-forge-rose',
    muted: 'text-forge-muted',
  };

  return (
    <div
      className="h-full flex flex-col bg-forge-bg border-t border-forge-border"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-forge-border bg-forge-surface flex-shrink-0">
        <TerminalIcon className="w-3.5 h-3.5 text-forge-muted" />
        <span className="text-xs font-medium text-forge-muted">Terminal</span>
        {loading && <Loader2 className="w-3 h-3 text-forge-amber animate-spin ml-auto" />}
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto p-3 terminal-text">
        {lines.map((line, i) => (
          <div key={i} className={cn('leading-5', lineColors[line.type] || 'text-forge-subtle')}>
            {line.text || '\u00A0'}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-forge-border/50 flex-shrink-0">
        <span className="text-forge-glow terminal-text flex-shrink-0">{PROMPT}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="flex-1 bg-transparent terminal-text text-forge-text focus:outline-none caret-forge-accent placeholder:text-forge-muted"
          placeholder="npm install react-query..."
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <span className="terminal-cursor" />}
      </div>
    </div>
  );
}

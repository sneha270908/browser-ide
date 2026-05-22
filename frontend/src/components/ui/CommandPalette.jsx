import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, File, Settings, TerminalSquare, Eye, Sidebar, LogOut } from 'lucide-react';
import { useUIStore, useProjectStore, useEditorStore, useAuthStore } from '../../store';
import { getLangColor, cn } from '../../lib/utils';

const buildCommands = ({ project, openTab, toggleTerminal, togglePreview, toggleSidebar, logout, navigate }) => {
  const fileCommands = (project?.files || [])
    .filter(f => f.type === 'file')
    .map(f => ({
      id: `file:${f.id}`,
      label: f.name,
      description: f.path,
      icon: File,
      iconColor: getLangColor(f.language),
      action: () => openTab(f.id),
      category: 'Files',
    }));

  return [
    ...fileCommands,
    {
      id: 'toggle:terminal',
      label: 'Toggle Terminal',
      description: 'Show or hide the terminal panel',
      icon: TerminalSquare,
      iconColor: '#10b981',
      action: toggleTerminal,
      category: 'View',
    },
    {
      id: 'toggle:preview',
      label: 'Toggle Preview',
      description: 'Show or hide the live preview',
      icon: Eye,
      iconColor: '#06b6d4',
      action: togglePreview,
      category: 'View',
    },
    {
      id: 'toggle:sidebar',
      label: 'Toggle Sidebar',
      description: 'Show or hide the file explorer',
      icon: Sidebar,
      iconColor: '#8b5cf6',
      action: toggleSidebar,
      category: 'View',
    },
    {
      id: 'auth:logout',
      label: 'Sign Out',
      description: 'Log out of CodeForge',
      icon: LogOut,
      iconColor: '#f43f5e',
      action: logout,
      category: 'Account',
    },
  ];
};

export default function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette, toggleTerminal, togglePreview, toggleSidebar } = useUIStore();
  const { currentProject } = useProjectStore();
  const { openTab } = useEditorStore();
  const { logout } = useAuthStore();

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef();
  const listRef = useRef();

  const commands = useMemo(() =>
    buildCommands({ project: currentProject, openTab, toggleTerminal, togglePreview, toggleSidebar, logout }),
    [currentProject]
  );

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const runSelected = () => {
    const cmd = filtered[selected];
    if (cmd) {
      cmd.action();
      closeCommandPalette();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      runSelected();
    } else if (e.key === 'Escape') {
      closeCommandPalette();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    const item = list?.children[selected];
    item?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  // Group commands by category
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((cmd, idx) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push({ ...cmd, _idx: idx });
    });
    return groups;
  }, [filtered]);

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 z-50 command-backdrop flex items-start justify-center pt-24 px-4"
          onClick={closeCommandPalette}
        >
          <motion.div
            initial={{ scale: 0.95, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full max-w-xl glass border border-forge-border rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-forge-border">
              <Search className="w-4 h-4 text-forge-muted flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search files and commands..."
                className="flex-1 bg-transparent text-forge-text placeholder:text-forge-muted text-sm focus:outline-none"
              />
              <kbd className="px-2 py-0.5 bg-forge-elevated rounded border border-forge-border text-forge-muted text-xs font-mono">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-forge-muted text-sm">
                  No commands found for "{query}"
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-4 py-1 text-xs font-medium text-forge-muted uppercase tracking-wider">
                      {category}
                    </div>
                    {items.map(cmd => (
                      <button
                        key={cmd.id}
                        onClick={() => { cmd.action(); closeCommandPalette(); }}
                        onMouseEnter={() => setSelected(cmd._idx)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          selected === cmd._idx
                            ? 'bg-forge-accent/10 text-forge-bright'
                            : 'text-forge-subtle hover:text-forge-text'
                        )}
                      >
                        <cmd.icon
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: cmd.iconColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-xs text-forge-muted truncate">{cmd.description}</div>
                          )}
                        </div>
                        {selected === cmd._idx && (
                          <kbd className="px-1.5 py-0.5 bg-forge-elevated rounded text-forge-muted text-xs font-mono flex-shrink-0">
                            ↵
                          </kbd>
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-forge-border text-xs text-forge-muted">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>esc close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

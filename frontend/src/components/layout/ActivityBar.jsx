import { motion } from 'framer-motion';
import {
  Code2, ArrowLeft, Save, Play, Terminal,
  Sidebar, Eye, Keyboard, Wifi, WifiOff, Circle
} from 'lucide-react';
import { useUIStore, useEditorStore, useProjectStore } from '../../store';
import { cn } from '../../lib/utils';

export default function ActivityBar({ onBack, isConnected }) {
  const { toggleCommandPalette, toggleSidebar, toggleTerminal, togglePreview } = useUIStore();
  const { dirtyTabs } = useEditorStore();
  const { currentProject } = useProjectStore();

  const hasDirty = dirtyTabs.size > 0;

  const iconBtn = (Icon, onClick, title, active = false, badge = false) => (
    <button
      key={title}
      onClick={onClick}
      title={title}
      className={cn(
        'relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150',
        active
          ? 'bg-forge-accent/10 text-forge-glow'
          : 'text-forge-muted hover:text-forge-text hover:bg-forge-elevated'
      )}
    >
      <Icon className="w-4 h-4" />
      {badge && (
        <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-forge-amber rounded-full" />
      )}
    </button>
  );

  return (
    <header className="h-10 flex items-center justify-between px-3 border-b border-forge-border bg-forge-surface flex-shrink-0 z-30">
      {/* Left: Logo + back + project name */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-forge-muted hover:text-forge-text transition-colors p-1 rounded"
          title="Back to dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-forge-border" />

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-forge-accent rounded flex items-center justify-center">
            <Code2 className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium text-forge-text truncate max-w-32 hidden sm:block">
            {currentProject?.name}
          </span>
        </div>

        {hasDirty && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1 text-xs text-forge-amber px-2 py-0.5 bg-forge-amber/10 rounded-full border border-forge-amber/20"
          >
            <Circle className="w-1.5 h-1.5 fill-forge-amber" />
            Unsaved
          </motion.div>
        )}
      </div>

      {/* Center: Command palette trigger */}
      <button
        onClick={toggleCommandPalette}
        className="hidden md:flex items-center gap-2 px-3 py-1 bg-forge-bg border border-forge-border rounded-lg text-forge-muted text-xs hover:border-forge-accent/40 hover:text-forge-text transition-all"
      >
        <Keyboard className="w-3 h-3" />
        <span>Command Palette</span>
        <kbd className="font-mono">⌘P</kbd>
      </button>

      {/* Right: Action icons */}
      <div className="flex items-center gap-1">
        {iconBtn(Sidebar, toggleSidebar, 'Toggle Sidebar')}
        {iconBtn(Terminal, toggleTerminal, 'Toggle Terminal')}
        {iconBtn(Eye, togglePreview, 'Toggle Preview')}

        <div className="w-px h-4 bg-forge-border mx-1" />

        {/* Connection status */}
        <div
          title={isConnected ? 'Connected' : 'Disconnected'}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs',
            isConnected ? 'text-forge-emerald' : 'text-forge-muted'
          )}
        >
          {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
        </div>
      </div>
    </header>
  );
}

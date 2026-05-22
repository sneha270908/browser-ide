import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Circle } from 'lucide-react';
import { useEditorStore, useProjectStore } from '../../store';
import { getLangColor, cn } from '../../lib/utils';

export default function TabBar() {
  const { openTabs, activeTabId, closeTab, setActiveTab, dirtyTabs } = useEditorStore();
  const { currentProject } = useProjectStore();
  const scrollRef = useRef();

  if (!currentProject) return null;

  const getFile = (id) => currentProject.files.find(f => f.id === id);

  return (
    <div
      ref={scrollRef}
      className="flex items-end gap-0 overflow-x-auto border-b border-forge-border bg-forge-surface"
      style={{ scrollbarWidth: 'none' }}
    >
      <AnimatePresence initial={false}>
        {openTabs.map(tabId => {
          const file = getFile(tabId);
          if (!file) return null;
          const isActive = tabId === activeTabId;
          const isDirty = dirtyTabs.has(tabId);

          return (
            <motion.button
              key={tabId}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                'tab-item flex items-center gap-2 px-4 py-2.5 text-xs whitespace-nowrap',
                'border-r border-forge-border transition-colors duration-100 flex-shrink-0',
                isActive
                  ? 'bg-forge-bg text-forge-bright'
                  : 'text-forge-muted hover:text-forge-text hover:bg-forge-bg/50'
              )}
            >
              {/* Language dot */}
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: getLangColor(file.language) }}
              />

              {/* Filename */}
              <span className="font-mono">{file.name}</span>

              {/* Dirty indicator / close button */}
              <span
                className="w-4 h-4 flex items-center justify-center flex-shrink-0"
                onClick={e => {
                  e.stopPropagation();
                  closeTab(tabId);
                }}
              >
                {isDirty ? (
                  <Circle className="w-2 h-2 fill-forge-amber text-forge-amber" />
                ) : (
                  <X className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:text-forge-rose transition-all" />
                )}
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Spacer */}
      <div className="flex-1 h-full min-h-[40px]" />
    </div>
  );
}

import { useEffect } from 'react';
import { useUIStore, useEditorStore } from '../store';

/**
 * useKeyboardShortcuts
 * Register global IDE keyboard shortcuts.
 * Should be called once at the app/workspace level.
 */
export function useKeyboardShortcuts() {
  const { openCommandPalette, toggleSidebar, toggleTerminal, togglePreview } = useUIStore();
  const { closeTab, activeTabId } = useEditorStore();

  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.metaKey || e.ctrlKey;

      // Ctrl+P → Command Palette
      if (ctrl && e.key === 'p') {
        e.preventDefault();
        openCommandPalette();
      }

      // Ctrl+B → Toggle Sidebar
      if (ctrl && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }

      // Ctrl+` → Toggle Terminal
      if (ctrl && e.key === '`') {
        e.preventDefault();
        toggleTerminal();
      }

      // Ctrl+W → Close active tab
      if (ctrl && e.key === 'w') {
        e.preventDefault();
        if (activeTabId) closeTab(activeTabId);
      }

      // Ctrl+Shift+P → Toggle Preview
      if (ctrl && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        togglePreview();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTabId]);
}

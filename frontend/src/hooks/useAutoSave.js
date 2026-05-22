import { useEffect, useRef } from 'react';
import { filesAPI } from '../lib/api';
import { useEditorStore, useProjectStore } from '../store';

/**
 * useAutoSave
 * Watches the active file content and auto-saves to MongoDB
 * with a configurable debounce delay.
 */
export function useAutoSave(delayMs = 1500) {
  const { activeTabId, fileContents, dirtyTabs, markSaved } = useEditorStore();
  const { currentProject } = useProjectStore();
  const timerRef = useRef(null);

  useEffect(() => {
    if (!activeTabId || !currentProject || !dirtyTabs.has(activeTabId)) return;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const content = fileContents[activeTabId];
      if (content === undefined) return;
      try {
        await filesAPI.update(currentProject._id, activeTabId, { content });
        markSaved(activeTabId, content);
      } catch {
        // Silently fail – user can manually save with Ctrl+S
      }
    }, delayMs);

    return () => clearTimeout(timerRef.current);
  }, [fileContents[activeTabId], activeTabId]);
}

import { useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore, useProjectStore } from '../../store';
import { filesAPI } from '../../lib/api';
import { getMonacoLanguage, debounce } from '../../lib/utils';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

// Monaco dark theme config
const FORGE_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '4a5568', fontStyle: 'italic' },
    { token: 'keyword', foreground: '8b5cf6' },
    { token: 'string', foreground: '10b981' },
    { token: 'number', foreground: 'f59e0b' },
    { token: 'type', foreground: '06b6d4' },
    { token: 'function', foreground: '60a5fa' },
  ],
  colors: {
    'editor.background': '#080c14',
    'editor.foreground': '#e2e8f0',
    'editor.lineHighlightBackground': '#0d1526',
    'editor.selectionBackground': '#2563eb33',
    'editor.inactiveSelectionBackground': '#2563eb1a',
    'editorCursor.foreground': '#2563eb',
    'editorLineNumber.foreground': '#1a2d50',
    'editorLineNumber.activeForeground': '#4a6fa5',
    'editorIndentGuide.background': '#1a2d5033',
    'editorIndentGuide.activeBackground': '#2563eb44',
    'editorGutter.background': '#080c14',
    'scrollbar.shadow': '#00000000',
    'scrollbarSlider.background': '#1a2d5044',
    'scrollbarSlider.hoverBackground': '#2563eb44',
    'minimap.background': '#080c14',
    'editorWidget.background': '#0d1526',
    'editorWidget.border': '#1a2d50',
    'input.background': '#111d35',
    'input.border': '#1a2d50',
  },
};

// Empty state shown when no tab is open
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center text-center p-8 h-full"
    >
      <div className="w-16 h-16 bg-forge-elevated border border-forge-border rounded-2xl flex items-center justify-center mb-5">
        <FileText className="w-7 h-7 text-forge-muted" />
      </div>
      <h3 className="text-forge-text font-medium mb-2">No file open</h3>
      <p className="text-forge-muted text-sm">Select a file from the explorer to start editing</p>
      <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-forge-muted">
        <kbd className="px-2 py-1 bg-forge-elevated rounded border border-forge-border font-mono">Ctrl+P</kbd>
        <span className="self-center">Command palette</span>
        <kbd className="px-2 py-1 bg-forge-elevated rounded border border-forge-border font-mono">Ctrl+S</kbd>
        <span className="self-center">Save file</span>
      </div>
    </motion.div>
  );
}

export default function CodeEditor() {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const saveTimerRef = useRef(null);

  const { activeTabId, fileContents, updateContent, markSaved } = useEditorStore();
  const { currentProject } = useProjectStore();

  const activeFile = currentProject?.files.find(f => f.id === activeTabId);
  const content = fileContents[activeTabId] ?? activeFile?.content ?? '';

  // Auto-save with debounce (1.5s after last keystroke)
  const autoSave = useCallback(
    debounce(async (fileId, value, projectId) => {
      try {
        await filesAPI.update(projectId, fileId, { content: value });
        markSaved(fileId, value);
      } catch {
        // Silently fail on auto-save
      }
    }, 1500),
    []
  );

  const handleChange = (value) => {
    if (!activeTabId || !currentProject) return;
    updateContent(activeTabId, value);
    autoSave(activeTabId, value, currentProject._id);
  };

  // Setup Monaco theme and options on mount
  const handleBeforeMount = (monaco) => {
    monacoRef.current = monaco;
    monaco.editor.defineTheme('forge-dark', FORGE_THEME);
  };

  const handleMount = (editor) => {
    editorRef.current = editor;

    // Ctrl+S to save immediately
    editor.addCommand(
      monacoRef.current.KeyMod.CtrlCmd | monacoRef.current.KeyCode.KeyS,
      async () => {
        if (!activeTabId || !currentProject) return;
        const value = editor.getValue();
        try {
          await filesAPI.update(currentProject._id, activeTabId, { content: value });
          markSaved(activeTabId, value);
        } catch {}
      }
    );
  };

  // Switch editor model when active tab changes
  useEffect(() => {
    if (editorRef.current && activeFile) {
      const model = editorRef.current.getModel();
      if (model) {
        // Update language without recreating model
        monacoRef.current?.editor.setModelLanguage(
          model,
          getMonacoLanguage(activeFile.name)
        );
      }
    }
  }, [activeTabId]);

  if (!activeTabId || !activeFile) {
    return (
      <div className="flex-1 bg-forge-bg flex items-center justify-center h-full">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-hidden">
      <Editor
        height="100%"
        language={getMonacoLanguage(activeFile.name)}
        value={content}
        theme="forge-dark"
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={handleChange}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          lineHeight: 22,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: 'line',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
          bracketPairColorization: { enabled: true },
          guides: { indentation: true, bracketPairs: true },
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
        }}
      />
    </div>
  );
}

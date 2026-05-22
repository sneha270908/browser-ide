import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ExternalLink, Globe, AlertCircle } from 'lucide-react';
import { useProjectStore, useEditorStore } from '../../store';
import { motion } from 'framer-motion';

// Build a self-contained HTML document from project files
const buildPreviewHTML = (files) => {
  const html = files.find(f => f.name === 'index.html' || f.path === '/index.html');
  const css = files.find(f => f.name === 'style.css' || f.name === 'styles.css');
  const js = files.find(f => f.name === 'app.js' || f.name === 'index.js' || f.name === 'main.js');

  if (!html) return null;

  let content = html.content || '';

  // Inject CSS inline
  if (css) {
    content = content.replace(
      /<link[^>]+href=["'][^"']*\.css["'][^>]*>/gi,
      `<style>${css.content}</style>`
    );
  }

  // Inject JS inline
  if (js) {
    content = content.replace(
      /<script[^>]+src=["'][^"']*\.js["'][^>]*><\/script>/gi,
      `<script>${js.content}</script>`
    );
  }

  return content;
};

export default function PreviewPanel() {
  const iframeRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const { currentProject } = useProjectStore();
  const { fileContents, activeTabId } = useEditorStore();

  // Build preview with in-memory content (not saved yet)
  const getPreviewHTML = useCallback(() => {
    if (!currentProject) return null;

    // Merge saved files with in-memory changes
    const mergedFiles = currentProject.files.map(f => ({
      ...f,
      content: fileContents[f.id] ?? f.content ?? '',
    }));

    return buildPreviewHTML(mergedFiles);
  }, [currentProject, fileContents]);

  const refresh = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setLastRefresh(Date.now());

    const html = getPreviewHTML();
    if (!html) {
      setIsLoading(false);
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      iframe.src = url;

      iframe.onload = () => {
        setIsLoading(false);
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, [getPreviewHTML]);

  // Auto-refresh on file changes (debounced via the activeTabId trigger)
  useEffect(() => {
    const timer = setTimeout(refresh, 800);
    return () => clearTimeout(timer);
  }, [fileContents, lastRefresh]);

  const hasHtml = currentProject?.files.some(
    f => f.name === 'index.html' || f.path === '/index.html'
  );

  return (
    <div className="h-full flex flex-col bg-forge-bg">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-forge-border bg-forge-surface flex-shrink-0">
        <Globe className="w-3.5 h-3.5 text-forge-muted" />
        <span className="text-xs font-medium text-forge-muted">Preview</span>

        {/* URL bar */}
        <div className="flex-1 mx-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-forge-bg rounded-lg border border-forge-border text-xs font-mono text-forge-muted">
            <span className="w-1.5 h-1.5 bg-forge-emerald rounded-full flex-shrink-0" />
            <span className="truncate">localhost • sandbox preview</span>
          </div>
        </div>

        <button
          onClick={refresh}
          className="p-1 hover:bg-forge-elevated rounded transition-colors text-forge-muted hover:text-forge-text"
          title="Refresh preview"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Preview area */}
      {!hasHtml ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center p-8"
        >
          <div className="w-14 h-14 bg-forge-elevated border border-forge-border rounded-2xl flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-forge-muted" />
          </div>
          <h3 className="text-forge-text font-medium mb-2 text-sm">No preview available</h3>
          <p className="text-forge-muted text-xs max-w-48">
            Add an <code className="text-forge-glow font-mono">index.html</code> file to enable live preview
          </p>
        </motion.div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-8 h-8 text-forge-rose mb-3" />
          <p className="text-forge-rose text-sm font-medium mb-1">Preview error</p>
          <p className="text-forge-muted text-xs font-mono">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-forge-elevated border border-forge-border rounded-lg text-xs text-forge-text hover:border-forge-accent transition-colors"
          >
            Try again
          </button>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          title="Live Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
          className="flex-1 w-full border-0 bg-white"
        />
      )}
    </div>
  );
}

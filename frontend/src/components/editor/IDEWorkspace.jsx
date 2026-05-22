import { useEffect, useState } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { motion, AnimatePresence } from 'framer-motion';

import ActivityBar from '../layout/ActivityBar';
import StatusBar from '../layout/StatusBar';
import FileTree from '../sidebar/FileTree';
import TabBar from '../editor/TabBar';
import CodeEditor from '../editor/CodeEditor';
import TerminalPanel from '../terminal/TerminalPanel';
import PreviewPanel from '../preview/PreviewPanel';
import CommandPalette from '../ui/CommandPalette';

import { useProjectStore, useUIStore, useEditorStore } from '../../store';
import { connectSocket, disconnectSocket } from '../../lib/socket';
import { useAuthStore } from '../../store';

// Drag handle between panels
function ResizeHandle({ direction = 'horizontal' }) {
  return (
    <PanelResizeHandle className={
      direction === 'horizontal'
        ? 'w-px bg-forge-border hover:bg-forge-accent/50 transition-colors cursor-col-resize'
        : 'h-px bg-forge-border hover:bg-forge-accent/50 transition-colors cursor-row-resize'
    } />
  );
}

export default function IDEWorkspace({ projectId, onBack }) {
  const { fetchProject, currentProject } = useProjectStore();
  const { sidebarOpen, terminalOpen, previewOpen, commandPaletteOpen, openCommandPalette } = useUIStore();
  const { openTabs } = useEditorStore();
  const { user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);

  // Load project
  useEffect(() => {
    fetchProject(projectId);
  }, [projectId]);

  // Setup socket connection for real-time
  useEffect(() => {
    if (!projectId || !user) return;

    const socket = connectSocket();

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join:project', { projectId, userId: user._id });
    });

    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      socket.emit('leave:project', { projectId });
      disconnectSocket();
    };
  }, [projectId, user]);

  // Global keyboard shortcut: Ctrl/Cmd+P for command palette
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        openCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (!currentProject) {
    return (
      <div className="h-screen bg-forge-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-forge-border border-t-forge-accent rounded-full animate-spin" />
          <p className="text-forge-muted text-sm">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-forge-bg overflow-hidden">
      {/* Top bar */}
      <ActivityBar onBack={onBack} isConnected={isConnected} />

      {/* Main layout */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Sidebar */}
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <>
                <Panel
                  defaultSize={18}
                  minSize={12}
                  maxSize={35}
                  className="bg-forge-surface border-r border-forge-border overflow-hidden"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="h-full"
                  >
                    <FileTree project={currentProject} />
                  </motion.div>
                </Panel>
                <ResizeHandle direction="horizontal" />
              </>
            )}
          </AnimatePresence>

          {/* Editor + Preview */}
          <Panel defaultSize={82} minSize={40} className="flex flex-col overflow-hidden">
            <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
              {/* Editor column */}
              <Panel defaultSize={previewOpen ? 55 : 100} minSize={30} className="flex flex-col overflow-hidden">
                <PanelGroup direction="vertical" className="flex-1 overflow-hidden">
                  {/* Tabs + Editor */}
                  <Panel defaultSize={terminalOpen ? 65 : 100} minSize={30} className="flex flex-col overflow-hidden">
                    <TabBar />
                    <div className="flex-1 overflow-hidden">
                      <CodeEditor />
                    </div>
                  </Panel>

                  {/* Terminal */}
                  <AnimatePresence initial={false}>
                    {terminalOpen && (
                      <>
                        <ResizeHandle direction="vertical" />
                        <Panel defaultSize={35} minSize={15} maxSize={60} className="overflow-hidden">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className="h-full"
                          >
                            <TerminalPanel />
                          </motion.div>
                        </Panel>
                      </>
                    )}
                  </AnimatePresence>
                </PanelGroup>
              </Panel>

              {/* Preview panel */}
              <AnimatePresence initial={false}>
                {previewOpen && (
                  <>
                    <ResizeHandle direction="horizontal" />
                    <Panel defaultSize={45} minSize={25} className="overflow-hidden">
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.15 }}
                        className="h-full"
                      >
                        <PreviewPanel />
                      </motion.div>
                    </Panel>
                  </>
                )}
              </AnimatePresence>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Command palette overlay */}
      <CommandPalette />
    </div>
  );
}

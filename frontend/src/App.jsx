import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import IDEWorkspace from './components/editor/IDEWorkspace';
import { useAuthStore } from './store';

export default function App() {
  const { isLoading, isAuthenticated, init } = useAuthStore();
  const [activeProjectId, setActiveProjectId] = useState(null);

  // Bootstrap: verify token and load user on mount
  useEffect(() => { init(); }, []);

  if (isLoading) {
    return (
      <div className="h-screen bg-forge-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-2 border-forge-border rounded-full" />
            <div className="absolute inset-0 border-2 border-t-forge-accent rounded-full animate-spin" />
          </div>
          <p className="text-forge-muted text-sm font-mono">Initializing CodeForge...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AuthPage />
          </motion.div>
        ) : activeProjectId ? (
          <motion.div
            key={`ide-${activeProjectId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-screen"
          >
            <IDEWorkspace
              projectId={activeProjectId}
              onBack={() => setActiveProjectId(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Dashboard onOpenProject={(id) => setActiveProjectId(id)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#111d35',
            color: '#e2e8f0',
            border: '1px solid #1a2d50',
            borderRadius: '12px',
            fontSize: '13px',
            fontFamily: 'Syne, system-ui, sans-serif',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#111d35' },
          },
          error: {
            iconTheme: { primary: '#f43f5e', secondary: '#111d35' },
          },
        }}
      />
    </>
  );
}

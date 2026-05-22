import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Plus, FolderOpen, Trash2, Clock, Search,
  LogOut, Zap, Globe, Terminal, ChevronRight, Layout,
} from 'lucide-react';
import { useAuthStore, useProjectStore } from '../store';
import { cn, timeAgo } from '../lib/utils';
import toast from 'react-hot-toast';

const TEMPLATES = [
  { id: 'blank', label: 'Blank', icon: Code2, desc: 'Empty project', color: '#64748b' },
  { id: 'react', label: 'React', icon: Zap, desc: 'React + JSX', color: '#61dafb' },
  { id: 'vanilla-js', label: 'JavaScript', icon: Globe, desc: 'HTML + CSS + JS', color: '#f7df1e' },
];

function Skeleton() {
  return (
    <div className="glass rounded-2xl p-6 border border-forge-border space-y-3">
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-3 w-1/3 mt-4" />
    </div>
  );
}

function CreateModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [template, setTemplate] = useState('blank');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('Project name is required');
    setLoading(true);
    try {
      await onCreate({ name: name.trim(), description: desc, template });
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 command-backdrop flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass border border-forge-border rounded-2xl p-8 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-display font-bold text-forge-bright mb-6">New Project</h2>

        <div className="space-y-5">
          <div>
            <label className="text-xs text-forge-muted mb-1.5 block font-medium uppercase tracking-wider">
              Project Name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="my-awesome-project"
              className="w-full bg-forge-bg border border-forge-border rounded-xl px-4 py-2.5 text-forge-text placeholder:text-forge-muted text-sm focus:outline-none focus:border-forge-accent transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-forge-muted mb-1.5 block font-medium uppercase tracking-wider">
              Template
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-150',
                    template === t.id
                      ? 'border-forge-accent bg-forge-accent/10'
                      : 'border-forge-border bg-forge-elevated hover:border-forge-border/80'
                  )}
                >
                  <t.icon className="w-5 h-5" style={{ color: t.color }} />
                  <span className="text-xs font-medium text-forge-text">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-forge-border text-forge-muted hover:text-forge-text text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-forge-accent text-white text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard({ onOpenProject }) {
  const { user, logout } = useAuthStore();
  const { projects, isLoading, fetchProjects, createProject, deleteProject } = useProjectStore();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await deleteProject(id);
    toast.success('Project deleted');
  };

  return (
    <div className="min-h-screen bg-forge-bg bg-grid flex flex-col">
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-forge-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="glass border-b border-forge-border sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-forge-accent rounded-lg flex items-center justify-center glow-blue">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-forge-bright">CodeForge</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-forge-muted text-sm hidden sm:block">
              {user?.username}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-forge-muted hover:text-forge-rose text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-forge-rose/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-display font-bold text-forge-bright mb-1">
            Welcome back, <span className="gradient-text">{user?.username}</span>
          </h1>
          <p className="text-forge-muted">Your projects, all in one place.</p>
        </motion.div>

        {/* Actions bar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forge-muted" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-forge-surface border border-forge-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-forge-text placeholder:text-forge-muted focus:outline-none focus:border-forge-accent transition-colors"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-forge-accent text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition-colors glow-blue"
          >
            <Plus className="w-4 h-4" />
            New Project
          </motion.button>
        </div>

        {/* Projects grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 bg-forge-elevated rounded-2xl flex items-center justify-center mb-4 border border-forge-border">
              <FolderOpen className="w-8 h-8 text-forge-muted" />
            </div>
            <h3 className="text-forge-text font-medium mb-2">No projects yet</h3>
            <p className="text-forge-muted text-sm mb-6">Create your first project to get started</p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-forge-accent/10 text-forge-glow rounded-xl text-sm border border-forge-accent/20 hover:bg-forge-accent/20 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((project, i) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onOpenProject(project._id)}
                className="group glass border border-forge-border rounded-2xl p-6 cursor-pointer hover:border-forge-accent/40 hover:glow-blue transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-forge-elevated border border-forge-border rounded-xl flex items-center justify-center group-hover:border-forge-accent/30 transition-colors">
                    <Layout className="w-5 h-5 text-forge-glow" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => handleDelete(e, project._id)}
                      className="p-1.5 hover:bg-forge-rose/10 hover:text-forge-rose text-forge-muted rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-forge-muted" />
                  </div>
                </div>

                <h3 className="font-display font-semibold text-forge-bright truncate mb-1">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-forge-muted text-xs truncate mb-3">{project.description}</p>
                )}

                <div className="flex items-center gap-1 text-forge-muted text-xs">
                  <Clock className="w-3 h-3" />
                  <span>{timeAgo(project.lastAccessedAt || project.updatedAt)}</span>
                  <span className="ml-auto px-2 py-0.5 bg-forge-elevated rounded-full border border-forge-border capitalize">
                    {project.template}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateModal
            onClose={() => setShowCreate(false)}
            onCreate={createProject}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

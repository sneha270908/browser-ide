import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Zap, Lock, Mail, User, ArrowRight, Terminal, Globe } from 'lucide-react';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

const features = [
  { icon: Terminal, text: 'Full browser IDE' },
  { icon: Zap, text: 'Real-time sync' },
  { icon: Globe, text: 'Instant preview' },
];

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      } else {
        await register(form.username, form.email, form.password);
        toast.success('Account created!');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = cn(
    'w-full bg-forge-elevated border border-forge-border rounded-xl px-4 py-3',
    'text-forge-text placeholder:text-forge-muted text-sm',
    'focus:outline-none focus:border-forge-accent focus:ring-1 focus:ring-forge-accent/40',
    'transition-all duration-200'
  );

  return (
    <div className="min-h-screen bg-forge-bg bg-grid flex overflow-hidden relative">
      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-forge-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-forge-purple/10 rounded-full blur-3xl pointer-events-none" />

      {/* Left - Hero section */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-16 relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-forge-accent rounded-xl flex items-center justify-center glow-blue">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-forge-bright tracking-tight">
            CodeForge
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forge-accent/10 border border-forge-accent/20 text-forge-glow text-xs font-mono">
              <span className="w-1.5 h-1.5 bg-forge-emerald rounded-full animate-pulse" />
              BROWSER-BASED IDE
            </div>
            <h1 className="text-5xl font-display font-bold leading-tight">
              <span className="text-forge-bright">Code anywhere,</span>
              <br />
              <span className="gradient-text">ship everywhere.</span>
            </h1>
            <p className="text-forge-subtle text-lg leading-relaxed max-w-md">
              A professional development environment that runs entirely in your browser.
              No setup, no installs, just code.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {features.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 text-forge-subtle"
              >
                <div className="w-8 h-8 bg-forge-elevated border border-forge-border rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-forge-glow" />
                </div>
                <span className="text-sm">{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Animated code preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-5 border border-forge-border/50 font-mono text-xs leading-6 animate-float"
        >
          <div className="flex items-center gap-1.5 mb-4">
            <div className="w-3 h-3 rounded-full bg-forge-rose/70" />
            <div className="w-3 h-3 rounded-full bg-forge-amber/70" />
            <div className="w-3 h-3 rounded-full bg-forge-emerald/70" />
            <span className="text-forge-muted ml-2">App.jsx</span>
          </div>
          <div className="space-y-1 text-forge-subtle">
            <div><span className="text-forge-purple">import</span> <span className="text-forge-cyan">{'{useState}'}</span> <span className="text-forge-purple">from</span> <span className="text-forge-emerald">'react'</span></div>
            <div className="h-1" />
            <div><span className="text-forge-purple">export default function</span> <span className="text-forge-glow">App</span><span className="text-forge-text">() {'{'}</span></div>
            <div className="pl-4"><span className="text-forge-purple">const</span> [count, setCount] = <span className="text-forge-cyan">useState</span><span className="text-forge-text">(0)</span></div>
            <div className="pl-4 text-forge-text"><span className="text-forge-purple">return</span> <span className="text-forge-amber">{'<button'}</span> onClick={'{'}<span className="text-forge-cyan">setCount</span>{'}'}<span className="text-forge-amber">{'>'}</span></div>
            <div className="pl-8 text-forge-text">Clicks: {'{'}<span className="text-forge-glow">count</span>{'}'}</div>
            <div className="pl-4 text-forge-amber">{'</button>'}</div>
            <div className="text-forge-text">{'}'}</div>
          </div>
        </motion.div>
      </div>

      {/* Right - Auth Form */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-forge-accent rounded-lg flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-display font-bold">CodeForge</span>
          </div>

          <div className="glass rounded-2xl p-8 border border-forge-border">
            {/* Tab toggle */}
            <div className="flex bg-forge-bg rounded-xl p-1 mb-8 border border-forge-border">
              {['login', 'register'].map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 capitalize',
                    mode === m
                      ? 'bg-forge-accent text-white shadow-sm'
                      : 'text-forge-muted hover:text-forge-text'
                  )}
                >
                  {m === 'login' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {mode === 'register' && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forge-muted" />
                    <input
                      type="text"
                      placeholder="Username"
                      value={form.username}
                      onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                      className={cn(inputClass, 'pl-10')}
                      required
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forge-muted" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className={cn(inputClass, 'pl-10')}
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forge-muted" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className={cn(inputClass, 'pl-10')}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl',
                    'bg-forge-accent text-white font-medium text-sm',
                    'hover:bg-blue-500 active:scale-[0.98]',
                    'transition-all duration-200 glow-blue',
                    'disabled:opacity-60 disabled:cursor-not-allowed'
                  )}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'Sign in' : 'Create account'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            </AnimatePresence>

            <p className="text-center text-forge-muted text-xs mt-6">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-forge-glow hover:underline"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

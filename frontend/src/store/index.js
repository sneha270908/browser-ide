import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { authAPI, projectsAPI, filesAPI } from '../lib/api';
import { debounce } from '../lib/utils';

// ── Auth Store ──────────────────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('cf_token'),
  isLoading: true,
  isAuthenticated: false,

  init: async () => {
    const token = localStorage.getItem('cf_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const { user } = await authAPI.me();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('cf_token');
      set({ user: null, isAuthenticated: false, isLoading: false, token: null });
    }
  },

  login: async (email, password) => {
    const { user, token } = await authAPI.login({ email, password });
    localStorage.setItem('cf_token', token);
    set({ user, token, isAuthenticated: true });
  },

  register: async (username, email, password) => {
    const { user, token } = await authAPI.register({ username, email, password });
    localStorage.setItem('cf_token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('cf_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

// ── Project Store ───────────────────────────────────────────────────────────
export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const { projects } = await projectsAPI.list();
      set({ projects, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchProject: async (id) => {
    set({ isLoading: true });
    try {
      const { project } = await projectsAPI.get(id);
      set({ currentProject: project, isLoading: false });
      // Sync editor state from persisted data
      useEditorStore.getState().restoreFromProject(project);
    } catch {
      set({ isLoading: false });
    }
  },

  createProject: async (data) => {
    const { project } = await projectsAPI.create(data);
    set(state => ({ projects: [project, ...state.projects] }));
    return project;
  },

  deleteProject: async (id) => {
    await projectsAPI.delete(id);
    set(state => ({ projects: state.projects.filter(p => p._id !== id) }));
  },

  updateFile: (fileId, updates) => {
    set(state => {
      if (!state.currentProject) return state;
      const files = state.currentProject.files.map(f =>
        f.id === fileId ? { ...f, ...updates } : f
      );
      return { currentProject: { ...state.currentProject, files } };
    });
  },

  addFile: (file) => {
    set(state => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          files: [...state.currentProject.files, file],
        },
      };
    });
  },

  removeFile: (fileIds) => {
    set(state => {
      if (!state.currentProject) return state;
      return {
        currentProject: {
          ...state.currentProject,
          files: state.currentProject.files.filter(f => !fileIds.includes(f.id)),
        },
      };
    });
  },
}));

// ── Editor Store ────────────────────────────────────────────────────────────
export const useEditorStore = create(
  subscribeWithSelector((set, get) => ({
    openTabs: [],        // Array of file IDs
    activeTabId: null,
    fileContents: {},    // fileId -> content (in-memory)
    savedContents: {},   // fileId -> last saved content
    dirtyTabs: new Set(), // fileIds with unsaved changes

    restoreFromProject: (project) => {
      const { openTabs, activeTabId } = project.editorState;
      const fileContents = {};
      project.files.forEach(f => {
        if (f.type === 'file') fileContents[f.id] = f.content || '';
      });
      set({
        openTabs: openTabs || [],
        activeTabId: activeTabId || null,
        fileContents,
        savedContents: { ...fileContents },
        dirtyTabs: new Set(),
      });
    },

    openTab: (fileId) => {
      set(state => {
        const openTabs = state.openTabs.includes(fileId)
          ? state.openTabs
          : [...state.openTabs, fileId];
        return { openTabs, activeTabId: fileId };
      });
    },

    closeTab: (fileId) => {
      set(state => {
        const tabs = state.openTabs.filter(id => id !== fileId);
        const dirtyTabs = new Set(state.dirtyTabs);
        dirtyTabs.delete(fileId);
        let activeTabId = state.activeTabId;
        if (activeTabId === fileId) {
          const idx = state.openTabs.indexOf(fileId);
          activeTabId = tabs[idx - 1] || tabs[idx] || null;
        }
        return { openTabs: tabs, activeTabId, dirtyTabs };
      });
    },

    setActiveTab: (fileId) => set({ activeTabId: fileId }),

    updateContent: (fileId, content) => {
      set(state => {
        const dirtyTabs = new Set(state.dirtyTabs);
        if (content !== state.savedContents[fileId]) {
          dirtyTabs.add(fileId);
        } else {
          dirtyTabs.delete(fileId);
        }
        return {
          fileContents: { ...state.fileContents, [fileId]: content },
          dirtyTabs,
        };
      });
    },

    markSaved: (fileId, content) => {
      set(state => {
        const dirtyTabs = new Set(state.dirtyTabs);
        dirtyTabs.delete(fileId);
        return {
          savedContents: { ...state.savedContents, [fileId]: content },
          dirtyTabs,
        };
      });
    },
  }))
);

// ── UI Store ────────────────────────────────────────────────────────────────
export const useUIStore = create((set) => ({
  commandPaletteOpen: false,
  sidebarOpen: true,
  terminalOpen: true,
  previewOpen: true,
  activePanel: 'editor',   // 'editor' | 'preview' | 'terminal'
  notifications: [],

  toggleCommandPalette: () =>
    set(state => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),

  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  toggleTerminal: () => set(state => ({ terminalOpen: !state.terminalOpen })),
  togglePreview: () => set(state => ({ previewOpen: !state.previewOpen })),
}));

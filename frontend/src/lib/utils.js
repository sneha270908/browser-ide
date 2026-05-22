import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes safely
export const cn = (...inputs) => twMerge(clsx(inputs));

// Get language icon color by language
export const getLangColor = (lang) => {
  const map = {
    javascript: '#f7df1e', typescript: '#3178c6', jsx: '#61dafb',
    tsx: '#3178c6', html: '#e34f26', css: '#1572b6', scss: '#cc6699',
    json: '#8b5cf6', markdown: '#94a3b8', python: '#3776ab',
    shell: '#4eaa25', yaml: '#cb171e', rust: '#f74c00', go: '#00add8',
    java: '#ed8b00', cpp: '#00599c', c: '#555599',
  };
  return map[lang] || '#64748b';
};

// Get file icon by language
export const getFileIcon = (lang) => {
  const icons = {
    javascript: 'JS', typescript: 'TS', jsx: 'JSX', tsx: 'TSX',
    html: 'HTML', css: 'CSS', scss: 'SCSS', json: 'JSON',
    python: 'PY', markdown: 'MD', shell: 'SH', rust: 'RS',
    go: 'GO', yaml: 'YML',
  };
  return icons[lang] || '{}';
};

// Debounce function for auto-save
export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// Format relative time
export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// Get Monaco language from file extension
export const getMonacoLanguage = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  const map = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    html: 'html', css: 'css', scss: 'scss', json: 'json',
    md: 'markdown', py: 'python', sh: 'shell', yml: 'yaml', yaml: 'yaml',
    rs: 'rust', go: 'go', java: 'java', cpp: 'cpp', c: 'c',
  };
  return map[ext] || 'plaintext';
};

// Build tree from flat file array
export const buildFileTree = (files) => {
  const map = {};
  const roots = [];

  files.forEach(file => {
    map[file.id] = { ...file, children: [] };
  });

  files.forEach(file => {
    if (file.parentId && map[file.parentId]) {
      map[file.parentId].children.push(map[file.id]);
    } else {
      roots.push(map[file.id]);
    }
  });

  // Sort: folders first, then files, both alphabetically
  const sort = (nodes) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(n => n.children && sort(n.children));
    return nodes;
  };

  return sort(roots);
};

/**
 * CodeForge API Client
 * Centralized API abstraction with auth token injection
 */

const BASE_URL = '/api';

// Get auth token from localStorage
const getToken = () => localStorage.getItem('cf_token');

// Core fetch wrapper
const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// ── Auth ─────────────────────────────────────────
export const authAPI = {
  register: (data) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => apiFetch('/auth/me'),
};

// ── Projects ──────────────────────────────────────
export const projectsAPI = {
  list: () => apiFetch('/projects'),
  get: (id) => apiFetch(`/projects/${id}`),
  create: (data) => apiFetch('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/projects/${id}`, { method: 'DELETE' }),
};

// ── Files ─────────────────────────────────────────
export const filesAPI = {
  create: (projectId, data) =>
    apiFetch(`/files/${projectId}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (projectId, fileId, data) =>
    apiFetch(`/files/${projectId}/${fileId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (projectId, fileId) =>
    apiFetch(`/files/${projectId}/${fileId}`, { method: 'DELETE' }),
  saveEditorState: (projectId, state) =>
    apiFetch(`/files/${projectId}/state/editor`, { method: 'PATCH', body: JSON.stringify(state) }),
};

// ── Packages ──────────────────────────────────────
export const packagesAPI = {
  list: (projectId) => apiFetch(`/packages/${projectId}`),
  install: (projectId, packageName) =>
    apiFetch(`/packages/${projectId}/install`, { method: 'POST', body: JSON.stringify({ packageName }) }),
  uninstall: (projectId, packageName) =>
    apiFetch(`/packages/${projectId}/${packageName}`, { method: 'DELETE' }),
};

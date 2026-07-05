import axios from 'axios';

/**
 * Central Axios instance for all API calls.
 *
 * In development  → VITE_API_BASE_URL is empty, so baseURL = '/api'
 *                   Vite dev-server proxy forwards /api → http://localhost:3000
 *
 * In production   → VITE_API_BASE_URL = 'https://snitch-s12s.onrender.com'
 *                   so baseURL = 'https://snitch-s12s.onrender.com/api'
 *                   Requests go directly to Render.
 */
export const BASE = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Construct full backend URLs for raw fetch/href operations (e.g. Google OAuth)
 * @param {string} path - path starting with '/' (e.g. '/api/auth/google')
 */
export function getBackendUrl(path) {
  return `${BASE}${path}`;
}

export default api;

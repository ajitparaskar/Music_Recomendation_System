import { backendUrl } from '../config';

/**
 * Absolute URL for API paths (e.g. `/recommend`, `/api/login`).
 */
export function apiUrl(path) {
  const base = backendUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Environment-driven API base URL.
 * Set VITE_BACKEND_URL in `.env` (e.g. production API or http://localhost:5000).
 */
export const backendUrl =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export function getApiBase() {
  // Prefer explicit override for dev (Vite runs on :5173, PHP runs on :80).
  const envBase = import.meta?.env?.VITE_API_BASE;
  if (envBase) {
    return String(envBase).replace(/\/+$/, '');
  }

  // If you're running via `npm run dev` at port 5173, the backend is almost
  // certainly the XAMPP PHP server on port 80 under your folder name.
  // Use the current host to support network access from other devices.
  try {
    const u = new URL(window.location.href);
    if (u.port === '5173') {
      // Use the current host (localhost or IP address) instead of hardcoded localhost
      const currentHost = u.hostname;
      return `http://${currentHost}/final/backend`;
    }
  } catch {
    // ignore
  }

  const path = window.location.pathname || '/';
  const basePath = path.split('/frontend')[0] || '';
  return `${window.location.origin}${basePath}/backend`;
}

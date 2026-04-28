export function getApiBase() {
  // Prefer explicit override for dev (Vite runs on :5173, PHP runs on :80).
  const envBase = import.meta?.env?.VITE_API_BASE;
  if (envBase) {
    return String(envBase).replace(/\/+$/, '');
  }

  // If you're running via `npm run dev` at port 5173, the backend is almost
  // certainly the XAMPP PHP server on port 80 under your folder name.
  // (This is a practical fallback when you forgot to set VITE_API_BASE.)
  try {
    const u = new URL(window.location.href);
    if (u.port === '5173') {
      return 'http://localhost/house_rental_%20platform/backend';
    }
  } catch {
    // ignore
  }

  const path = window.location.pathname || '/';
  const basePath = path.split('/frontend')[0] || '';
  return `${window.location.origin}${basePath}/backend`;
}


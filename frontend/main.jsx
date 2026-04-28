import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  Link,
} from 'react-router-dom';
import { Menu } from 'lucide-react';

import Dashboard from './dashboard.jsx';
import AdminPanel from './admin_panel.jsx';
import Notifications from './notifications.jsx';
import Landing from './landing.jsx';
import { PrivacyPolicyPage, TermsOfServicePage } from './legal.jsx';
import { I18nProvider, LanguageSwitcher, useI18n } from './i18n.jsx';

import './styles.css';
import { getApiBase as getApiBaseFn } from './api.js';
import {
  clearAuthStorage,
  migrateLegacyLocalUser,
  readLastPath,
  readStoredUser,
  resolveResumePath,
  writeLastPath,
  writeStoredUser,
} from './authStorage.js';

const useApi = () => useMemo(() => getApiBaseFn(), []);

const AuthProvider = ({ children }) => {
  const apiBase = useApi();
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    writeStoredUser(user);
  }, [user]);

  useEffect(() => {
    // Allows login/logout pages to update auth immediately without a full reload.
    const syncFromStorage = () => {
      setUser(readStoredUser());
    };

    window.addEventListener('hrp:auth-updated', syncFromStorage);
    return () => window.removeEventListener('hrp:auth-updated', syncFromStorage);
  }, []);

  useEffect(() => {
    // Check for existing session on app load
    const checkSession = async () => {
      setRestoring(true);

      try {
        migrateLegacyLocalUser();

        const cachedUser = readStoredUser();
        if (cachedUser) {
          console.log('Restoring from cache:', cachedUser);
          setUser(cachedUser);
        }

        const res = await fetch(`${apiBase}/me.php`, { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        console.log('Server verification:', data);
        if (res.ok && data.ok === true && data.user) {
          console.log('Setting user from server:', data.user);
          setUser(data.user);
          writeStoredUser(data.user);
        } else {
          console.log('Server says no valid session');
          setUser(null);
          clearAuthStorage();
        }
      } catch (error) {
        console.error('Session restoration error:', error);
        const cached = readStoredUser();
        if (cached) {
          setUser(cached);
        } else {
          setUser(null);
        }
      } finally {
        setRestoring(false);
      }
    };
    void checkSession();
  }, [apiBase]);

  const logout = async () => {
    try {
      await fetch(`${apiBase}/logout.php`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Network errors are ignored during logout
    }
    clearAuthStorage();
    setUser(null);
    window.dispatchEvent(new Event('hrp:auth-updated'));
    
    // Use navigate instead of direct hash manipulation to avoid DOM conflicts
    // Small delay to ensure state updates are processed
    setTimeout(() => {
      window.location.hash = '/';
      window.location.reload(); // Force reload to clean up any DOM issues
    }, 100);
  };

  const value = { user, setUser, logout, restoring };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const AuthContext = React.createContext(null);
const useAuth = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

/** Saves the current route while logged in; reopens that route after a new visit at #/. */
function SessionResumeRoutes() {
  const { user, restoring } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const prevRestoring = useRef(true);

  useEffect(() => {
    if (restoring || !user) return;
    const p = location.pathname;
    if (p && p !== '/') {
      writeLastPath(p);
    }
  }, [restoring, user, location.pathname]);

  useEffect(() => {
    const finishedRestore = prevRestoring.current && !restoring;
    prevRestoring.current = restoring;

    if (!finishedRestore || !user) return;

    const raw = window.location.hash.replace(/^#/, '') || '/';
    const pathOnly = raw.split('?')[0] || '/';
    if (pathOnly !== '/' && pathOnly !== '') return;

    const saved = readLastPath();
    const target = resolveResumePath(saved, user);
    navigate(target, { replace: true });
  }, [restoring, user, navigate]);

  return null;
}

const ProtectedRoute = ({ roles, children }) => {
  const { t } = useI18n();
  const { user, restoring } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute:', { user, restoring, roles, path: location.pathname });

  // Show loading during restoration if we need to check roles
  if (restoring) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
        {t('Restoring session...')}
      </div>
    );
  }

  if (!user) {
    console.log('No user, redirecting to landing page');
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    console.log('User role check failed:', { userRole: user.role, requiredRoles: roles });
    return <Navigate to="/dashboard" replace />;
  }

  console.log('Access granted for user:', user.role);
  return children;
};

const TopBar = () => {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handlePropertyClick = (propertyId) => {
    // Navigate to dashboard and open property detail
    navigate('/dashboard', { replace: true });
    // The dashboard component will handle opening the property detail
    setTimeout(() => {
      // Trigger a custom event that the dashboard can listen for
      window.dispatchEvent(new CustomEvent('openPropertyDetail', { detail: { propertyId } }));
    }, 100);
  };

  const handleRenterMenuToggle = () => {
    // Trigger custom event for dashboard to handle sidebar toggle
    window.dispatchEvent(new CustomEvent('toggleRenterSidebar'));
  };

  // Don't show TopBar on landing page since it has its own navigation
  if (location.pathname === '/') {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-blue-900/95 to-slate-900 border-b border-blue-800/30 backdrop-blur-xl shadow-2xl animate-gradient-shift">
      <div className="mx-auto flex max-w-full items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/" className="group flex items-center gap-2 sm:gap-3 transition-all duration-500 hover:scale-105 relative">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-500 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 group-hover:shadow-2xl transition-all duration-500 animate-pulse-subtle relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shimmer"></div>
              <svg className="h-4 w-4 sm:h-6 sm:w-6 text-white group-hover:rotate-12 transition-transform duration-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div className="flex flex-col relative">
              <span className="text-base sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 group-hover:from-blue-200 group-hover:to-cyan-200 transition-all duration-500 animate-text-shimmer">
                {t('House Rental')}
              </span>
              <span className="text-xs text-blue-200/80 font-medium hidden xs:block sm:block group-hover:text-cyan-200 transition-colors duration-500">
                {t('Renter services & Owner listing')}
              </span>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-slide-in"></div>
            </div>
          </Link>
        </div>
        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:shadow-xl hover:shadow-white/10 group">
              <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300 animate-pulse-subtle relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shimmer"></div>
                <span className="text-white text-xs sm:text-sm font-bold relative z-10">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-20 sm:max-w-none group-hover:text-blue-100 transition-colors duration-300">{user.full_name}</span>
                <span className="text-xs text-blue-200/80 capitalize group-hover:text-cyan-200 transition-colors duration-300">{user.role}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <LanguageSwitcher className="hidden md:inline-flex mr-1" />
              {/* Hamburger menu for renters on mobile */}
              {user.role === 'renter' && (
                <button
                  className="md:hidden rounded-lg border border-white/30 bg-white/10 backdrop-blur px-2 py-2 text-white transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:scale-110 hover:shadow-lg hover:shadow-white/20 group"
                  onClick={handleRenterMenuToggle}
                >
                  <Menu className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              )}
              <Notifications onPropertyClick={handlePropertyClick} />
              <button
                className="group flex items-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-red-500 via-pink-500 to-red-600 px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all duration-500 hover:from-red-600 hover:via-pink-600 hover:to-red-700 hover:shadow-red-500/50 hover:shadow-2xl hover:scale-105 border border-red-500/20 hover:border-red-400/40 relative overflow-hidden"
                onClick={logout}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
                <svg className="h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-500 group-hover:rotate-12 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline relative z-10 group-hover:text-pink-100 transition-colors duration-300">{t('Logout')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher className="hidden md:inline-flex mr-1" />
            <button
              onClick={() => {
                // Open login modal on landing page
                window.location.hash = '/';
                setTimeout(() => {
                  const loginBtn = document.querySelector('[data-login-modal-trigger]');
                  if (loginBtn) loginBtn.click();
                }, 100);
              }}
              className="group rounded-lg sm:rounded-xl border border-white/30 bg-white/10 backdrop-blur px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white transition-all duration-500 hover:bg-white/20 hover:border-white/40 hover:scale-105 hover:shadow-lg hover:shadow-white/20 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
              <span className="relative z-10">{t('Login')}</span>
            </button>
            <button
              onClick={() => {
                // Open signup modal on landing page
                window.location.hash = '/';
                setTimeout(() => {
                  const signupBtn = document.querySelector('[data-signup-modal-trigger]');
                  if (signupBtn) signupBtn.click();
                }, 100);
              }}
              className="group rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all duration-500 hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 hover:shadow-blue-500/50 hover:shadow-2xl hover:scale-105 border border-blue-500/20 hover:border-blue-400/40 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
              <span className="relative z-10 group-hover:text-cyan-100 transition-colors duration-300">{t('Sign up')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { t } = useI18n();
  const { user, restoring } = useAuth();
  const location = useLocation();
  
  // Show loading while restoring to prevent redirects during auth restoration
  if (restoring) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
        {t('Loading...')}
      </div>
    );
  }

  const pageContainerClass = (() => {
    if (location.pathname === '/') return '';
    if (location.pathname === '/admin' || location.pathname === '/dashboard') return 'w-full pt-20 pb-0 px-0';
    return 'mx-auto max-w-5xl px-4 pt-24 pb-6';
  })();

  return (
    <div className={pageContainerClass}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <SessionResumeRoutes />
      <TopBar key="topbar" />
      <AppRoutes key="approutes" />
    </HashRouter>
  );
};

const Root = () => (
  <I18nProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </I18nProvider>
);

createRoot(document.getElementById('app')).render(<Root />);


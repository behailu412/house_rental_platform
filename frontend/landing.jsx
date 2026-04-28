import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { getApiBase } from './api.js';
import { writeStoredUser } from './authStorage.js';
import { LanguageSwitcher } from './i18n.jsx';

const Landing = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const navigate = useNavigate();

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Signup form state
  const [signupData, setSignupData] = useState({
    full_name: '',
    identifier: '',
    role: '',
    password: '',
    confirm_password: '',
    terms: false
  });
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [signupError, setSignupError] = useState('');

  const LANDING_THEME_KEY = 'ethiorent-landing-theme';
  const [landingDark, setLandingDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem(LANDING_THEME_KEY);
      if (stored === 'dark') return true;
      // Default: light mode + original backgrounds (no OS theme detection).
      return false;
    } catch {
      return false;
    }
  });

  const toggleLandingTheme = () => {
    setLandingDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(LANDING_THEME_KEY, next ? 'dark' : 'light');
      } catch {
        /* ignore quota / private mode */
      }
      return next;
    });
  };

  const openLoginModal = () => {
    setShowLoginModal(true);
    setShowSignupModal(false);
  };

  const openSignupModal = () => {
    setShowSignupModal(true);
    setShowLoginModal(false);
  };

  const closeModal = () => {
    setShowLoginModal(false);
    setShowSignupModal(false);
  };

  const handleSmoothScroll = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  // Validation logic
  const loginValidation = useMemo(() => {
    try {
      const v = (loginIdentifier || '').trim();
      const localOk = /^09\d{8}$/.test(v);
      const intlOk = /^\+2519\d{8}$/.test(v.replace(/\s+/g, ''));
      const idOk = localOk || intlOk;
      const passwordOk = loginPassword.length > 0;
      return {
        idOk,
        passwordOk,
        requiredOk: idOk && passwordOk,
      };
    } catch (err) {
      const passwordOk = loginPassword.length > 0;
      return {
        idOk: false,
        passwordOk,
        requiredOk: false,
      };
    }
  }, [loginIdentifier, loginPassword]);

  const canLoginSubmit = loginValidation.requiredOk && !loginSubmitting;

  // Login handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!canLoginSubmit) {
      setLoginError('Enter a valid phone number and password.');
      return;
    }

    const apiBase = getApiBase();
    setLoginSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok !== true) {
        setLoginError(data.error || 'Login failed');
        return;
      }

      writeStoredUser(data.user);
      window.dispatchEvent(new Event('hrp:auth-updated'));
      setShowLoginModal(false);
      setLoginIdentifier('');
      setLoginPassword('');
      
      // Navigate to appropriate page
      navigate(data.user?.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch {
      setLoginError('Network error. Please try again.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Signup handler
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError('');
    
    if (!signupData.full_name || !signupData.identifier || !signupData.role || !signupData.password) {
      setSignupError('Please fill all required fields.');
      return;
    }
    
    if (signupData.password !== signupData.confirm_password) {
      setSignupError('Passwords do not match.');
      return;
    }

    if (signupData.password.length < 6) {
      setSignupError('Password must be at least 6 characters.');
      return;
    }

    if (!signupData.terms) {
      setSignupError('You must agree to Terms of Service and Privacy Policy.');
      return;
    }

    const apiBase = getApiBase();
    setSignupSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: signupData.full_name,
          phone: signupData.identifier,
          role: signupData.role,
          password: signupData.password,
          confirm_password: signupData.confirm_password
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok !== true) {
        setSignupError(data.error || 'Signup failed');
        return;
      }

      // Show success message and redirect to login
      setSignupError('');
      setShowSignupModal(false);
      setSignupData({
        full_name: '',
        identifier: '',
        role: '',
        password: '',
        confirm_password: '',
        terms: false
      });
      
      // Show success modal or redirect to login
      setTimeout(() => {
        openLoginModal();
      }, 500);
    } catch {
      setSignupError('Network error. Please try again.');
    } finally {
      setSignupSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full bg-white text-slate-900 antialiased transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100 ${landingDark ? 'dark' : ''}`}
    >
    <div className="min-h-screen w-full">
      {/* Hero Section with Background */}
      <div className="relative min-h-screen bg-hero-pattern">
        <div className="absolute inset-0 bg-hero-overlay"></div>
        
        {/* Navigation Bar */}
        <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-100 bg-white shadow-xl backdrop-blur-xl dark:border-zinc-700/60 dark:bg-zinc-950/90 dark:shadow-black/40">
        <div className="w-full ml-0 mr-0 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="flex-shrink-0 group">
                <div className="flex items-center space-x-3 transition-all duration-300 group-hover:scale-105">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:rotate-6">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent dark:from-zinc-100 dark:via-white dark:to-zinc-200">EthioRent</h1>
                </div>
              </div>
              <div className="hidden md:block ml-12">
                <div className="flex items-baseline space-x-2">
                  <button onClick={() => handleSmoothScroll('home')} className="group relative px-4 py-3 text-sm font-semibold text-gray-900 transition-all duration-300 hover:scale-105 hover:text-blue-600 dark:text-zinc-200 dark:hover:text-blue-400">
                    <span className="relative z-10">Home</span>
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-blue-500/10 dark:to-purple-500/10"></div>
                  </button>
                  <button onClick={() => handleSmoothScroll('how-it-works')} className="group relative px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-300 hover:scale-105 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
                    <span className="relative z-10">How it Works</span>
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-blue-500/10 dark:to-purple-500/10"></div>
                  </button>
                  <button onClick={() => handleSmoothScroll('features')} className="group relative px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-300 hover:scale-105 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
                    <span className="relative z-10">Features</span>
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-blue-500/10 dark:to-purple-500/10"></div>
                  </button>
                  <button onClick={() => handleSmoothScroll('faq')} className="group relative px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-300 hover:scale-105 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
                    <span className="relative z-10">FAQ</span>
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-blue-500/10 dark:to-purple-500/10"></div>
                  </button>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
              <LanguageSwitcher className="mr-1" />
              <button
                type="button"
                onClick={toggleLandingTheme}
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-200 bg-white/90 text-amber-600 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 dark:border-zinc-600 dark:bg-zinc-800/90 dark:text-amber-300 dark:hover:border-amber-500/40 dark:hover:bg-zinc-700"
                aria-label={landingDark ? 'Use light theme' : 'Use dark theme'}
                title={landingDark ? 'Light mode' : 'Dark mode'}
              >
                {landingDark ? <Sun className="h-5 w-5" strokeWidth={2} /> : <Moon className="h-5 w-5" strokeWidth={2} />}
              </button>
              <button
                onClick={openLoginModal}
                data-login-modal-trigger
                className="group relative rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition-all duration-300 hover:scale-105 hover:border-blue-300 hover:text-blue-600 hover:shadow-lg dark:border-zinc-600 dark:text-zinc-200 dark:hover:border-blue-500/50 dark:hover:text-blue-400"
              >
                <span className="relative z-10">Sign In</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-blue-500/10 dark:to-purple-500/10"></div>
              </button>
              <button
                onClick={openSignupModal}
                data-signup-modal-trigger
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-3 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 hover:shadow-2xl hover:shadow-blue-500/25"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <span>Get Started</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              </button>
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="relative rounded-xl p-3 text-gray-900 transition-all duration-300 hover:scale-110 hover:bg-gray-100 hover:text-blue-600 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="border-t border-gray-200 bg-white shadow-2xl backdrop-blur-xl dark:border-zinc-700/60 dark:bg-zinc-900/95 md:hidden">
              <div className="space-y-1 px-3 pb-4 pt-3">
                <button onClick={() => handleSmoothScroll('home')} className="block w-full rounded-xl px-4 py-3 text-left text-base font-semibold text-gray-900 transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 dark:text-zinc-100 dark:hover:from-blue-500/10 dark:hover:to-purple-500/10 dark:hover:text-blue-400">Home</button>
                <button onClick={() => handleSmoothScroll('how-it-works')} className="block w-full rounded-xl px-4 py-3 text-left text-base font-semibold text-gray-700 transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 dark:text-zinc-300 dark:hover:from-blue-500/10 dark:hover:to-purple-500/10 dark:hover:text-blue-400">How it Works</button>
                <button onClick={() => handleSmoothScroll('features')} className="block w-full rounded-xl px-4 py-3 text-left text-base font-semibold text-gray-700 transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 dark:text-zinc-300 dark:hover:from-blue-500/10 dark:hover:to-purple-500/10 dark:hover:text-blue-400">Features</button>
                <button onClick={() => handleSmoothScroll('faq')} className="block w-full rounded-xl px-4 py-3 text-left text-base font-semibold text-gray-700 transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 dark:text-zinc-300 dark:hover:from-blue-500/10 dark:hover:to-purple-500/10 dark:hover:text-blue-400">FAQ</button>
                <div className="mt-3 space-y-2 border-t border-gray-200/50 pt-3 dark:border-zinc-700/60">
                  <div className="flex flex-wrap items-center gap-3 px-4 py-2">
                    <LanguageSwitcher />
                    <button
                      type="button"
                      onClick={toggleLandingTheme}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-200 bg-white text-amber-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-amber-300"
                      aria-label={landingDark ? 'Use light theme' : 'Use dark theme'}
                    >
                      {landingDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                  </div>
                  <button onClick={openLoginModal} className="block w-full rounded-xl px-4 py-3 text-left text-base font-semibold text-gray-700 transition-all duration-300 hover:scale-105 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 dark:text-zinc-300 dark:hover:from-blue-500/10 dark:hover:to-purple-500/10 dark:hover:text-blue-400">Sign In</button>
                  <button onClick={openSignupModal} className="block w-full rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-4 py-3 text-left text-base font-bold text-white transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 hover:shadow-lg">Get Started</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center animate-fade-in">
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium border border-white/20">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Trusted by 10,000+ renters across Ethiopia
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              The Modern Way to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Find Your Home
              </span>
            </h1>
            <p className="mx-auto mb-12 max-w-4xl text-xl leading-relaxed text-gray-200 dark:text-zinc-300 md:text-2xl">
              Connect directly with verified property owners. Browse premium listings, chat instantly, and secure your perfect rental—no agents, no commissions, no hassle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={openSignupModal}
                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/25 flex items-center space-x-2"
              >
                <span>Start Your Search</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <button
                onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                className="group border-2 border-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:border-white hover:bg-white/10 transition-all duration-300 flex items-center space-x-2"
              >
                <span>How It Works</span>
                <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Hero Stats */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">5,000+</div>
              <div className="text-gray-300 text-lg">Active Properties</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">50+</div>
              <div className="text-gray-300 text-lg">Cities Covered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">98%</div>
              <div className="text-gray-300 text-lg">Satisfaction Rate</div>
            </div>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
            <div className="flex items-center space-x-2 text-white/80">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Verified Listings</span>
            </div>
            <div className="flex items-center space-x-2 text-white/80">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Direct Communication</span>
            </div>
            <div className="flex items-center space-x-2 text-white/80">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No Commission Fees</span>
            </div>
          </div>
        </div>
      </section>
      </div> {/* Close hero background wrapper */}

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-white py-24 dark:bg-gradient-to-b dark:from-zinc-900 dark:to-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="mb-6 inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 dark:bg-blue-500/15 dark:text-blue-300">
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              Simple 3-Step Process
            </div>
            <h2 className="mb-6 text-4xl font-bold text-gray-900 dark:text-zinc-50 md:text-5xl">
              How <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">EthioRent</span> Works
            </h2>
            <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-600 dark:text-zinc-400">
              Get started in minutes and find your perfect home without any middlemen or hidden fees
            </p>
          </div>
          
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute left-0 right-0 top-1/2 hidden h-0.5 -translate-y-1/2 transform bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-blue-500/20 md:block"></div>
            
            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="group">
                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl transition-all duration-300 hover:border-blue-200 hover:shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:hover:border-blue-500/40">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 transition-transform duration-300 group-hover:scale-110">
                    <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">Step 1</span>
                    <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-zinc-50">Create Account</h3>
                    <p className="leading-relaxed text-gray-600 dark:text-zinc-400">Sign up in seconds as a renter or property owner. Verify your identity and start your journey.</p>
                  </div>
                </div>
              </div>
              
              <div className="group">
                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl transition-all duration-300 hover:border-purple-200 hover:shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:hover:border-purple-500/40">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 transition-transform duration-300 group-hover:scale-110">
                    <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <span className="mb-4 inline-block rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-800 dark:bg-purple-500/20 dark:text-purple-300">Step 2</span>
                    <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-zinc-50">Browse & Chat</h3>
                    <p className="leading-relaxed text-gray-600 dark:text-zinc-400">Explore verified listings, use advanced filters, and connect directly with property owners through our built-in chat.</p>
                  </div>
                </div>
              </div>
              
              <div className="group">
                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl transition-all duration-300 hover:border-green-200 hover:shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:hover:border-emerald-500/40">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-green-500 to-green-600 transition-transform duration-300 group-hover:scale-110">
                    <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <span className="mb-4 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800 dark:bg-emerald-500/20 dark:text-emerald-300">Step 3</span>
                    <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-zinc-50">Secure & Move</h3>
                    <p className="leading-relaxed text-gray-600 dark:text-zinc-400">Complete secure payments, sign digital agreements, and get your keys. Your new home awaits!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-24 dark:bg-gradient-to-b dark:from-zinc-950 dark:to-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <div className="mb-6 inline-flex items-center rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-800 dark:bg-purple-500/15 dark:text-purple-300">
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              Premium Features
            </div>
            <h2 className="mb-6 text-4xl font-bold text-gray-900 dark:text-zinc-50 md:text-5xl">
              Why Choose <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400">EthioRent</span>
            </h2>
            <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-600 dark:text-zinc-400">
              Experience the future of property rental with cutting-edge features designed for your convenience
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:border-purple-200 hover:shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:hover:border-purple-500/50 dark:shadow-black/30">
              <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-green-100 to-green-50 transition-transform duration-500 group-hover:scale-150 dark:from-emerald-500/10 dark:to-transparent"></div>
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-green-500 to-green-600 transition-transform duration-300 group-hover:scale-110">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-zinc-50">Verified Listings</h3>
                <p className="leading-relaxed text-gray-600 dark:text-zinc-400">Every property undergoes rigorous verification by our admin team, ensuring authenticity and your complete safety.</p>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:border-blue-200 hover:shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:hover:border-blue-500/50 dark:shadow-black/30">
              <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 transition-transform duration-500 group-hover:scale-150 dark:from-blue-500/10 dark:to-transparent"></div>
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 transition-transform duration-300 group-hover:scale-110">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-zinc-50">Direct Chat</h3>
                <p className="leading-relaxed text-gray-600 dark:text-zinc-400">Connect instantly with property owners through our real-time messaging system with read receipts and instant notifications.</p>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:border-purple-200 hover:shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:hover:border-purple-500/50 dark:shadow-black/30">
              <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 transition-transform duration-500 group-hover:scale-150 dark:from-purple-500/10 dark:to-transparent"></div>
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 transition-transform duration-300 group-hover:scale-110">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-zinc-50">Secure Payments</h3>
                <p className="leading-relaxed text-gray-600 dark:text-zinc-400">Multiple payment options including Chapa and Telebirr with bank-level security and instant confirmation.</p>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:border-orange-200 hover:shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:hover:border-orange-500/50 dark:shadow-black/30">
              <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 transition-transform duration-500 group-hover:scale-150 dark:from-orange-500/10 dark:to-transparent"></div>
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 transition-transform duration-300 group-hover:scale-110">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-zinc-50">Smart Search</h3>
                <p className="leading-relaxed text-gray-600 dark:text-zinc-400">Advanced filtering with city autocomplete, price ranges, property types, and AI-powered recommendations.</p>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:border-pink-200 hover:shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:hover:border-pink-500/50 dark:shadow-black/30">
              <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-pink-100 to-pink-50 transition-transform duration-500 group-hover:scale-150 dark:from-pink-500/10 dark:to-transparent"></div>
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 transition-transform duration-300 group-hover:scale-110">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-zinc-50">Wishlist</h3>
                <p className="leading-relaxed text-gray-600 dark:text-zinc-400">Save your favorite properties, track price changes, and receive alerts when matching properties become available.</p>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:border-indigo-200 hover:shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:hover:border-indigo-500/50 dark:shadow-black/30">
              <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 transition-transform duration-500 group-hover:scale-150 dark:from-indigo-500/10 dark:to-transparent"></div>
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 transition-transform duration-300 group-hover:scale-110">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-zinc-50">Live Updates</h3>
                <p className="leading-relaxed text-gray-600 dark:text-zinc-400">Real-time notifications for new listings, messages, and property updates keep you ahead of the competition.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-white py-24 dark:bg-gradient-to-b dark:from-zinc-900 dark:to-zinc-950">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <div className="mb-6 inline-flex items-center rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800 dark:bg-orange-500/15 dark:text-orange-300">
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Got Questions?
            </div>
            <h2 className="mb-6 text-4xl font-bold text-gray-900 dark:text-zinc-50 md:text-5xl">
              Frequently Asked <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent dark:from-orange-400 dark:to-red-400">Questions</span>
            </h2>
            <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-600 dark:text-zinc-400">
              Everything you need to know about EthioRent and how we can help you find your perfect home
            </p>
          </div>
          
          <div className="space-y-4">
            {[
              {
                id: 1,
                question: "How do I start searching for properties?",
                answer: "Simply sign up for a free account, then browse our extensive listings. You can filter by location, price range, property type, and more. Our advanced search algorithms will help you find exactly what you're looking for."
              },
              {
                id: 2,
                question: "Is it free to list my property?",
                answer: "Property owners can list their properties for free. There's only a small verification fee to ensure listing quality and security. This helps us maintain a trusted platform with legitimate listings only."
              },
              {
                id: 3,
                question: "How do I know the listings are legitimate?",
                answer: "All properties go through our rigorous verification process. Our admin team reviews each listing, verifies ownership, and ensures accuracy. We also require property photos and documentation for verification."
              },
              {
                id: 4,
                question: "Can I communicate directly with property owners?",
                answer: "Yes! Our platform enables direct communication between renters and property owners through our secure messaging system. You can chat instantly, share documents, and even schedule viewings."
              },
              {
                id: 5,
                question: "What payment methods are supported?",
                answer: "We support multiple payment methods including Chapa, Telebirr, and bank transfers for your convenience and security. All transactions are encrypted and processed through our secure payment gateway."
              },
              {
                id: 6,
                question: "How quickly can I move into a property?",
                answer: "Once you've found your perfect property and completed the payment process, you can typically move in within 1-3 days, depending on the property owner's availability and any required preparations."
              }
            ].map((faq) => (
              <div key={faq.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:hover:border-zinc-600">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="flex w-full items-center justify-between rounded-2xl px-8 py-6 text-left transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-zinc-800/80"
                >
                  <h3 className="pr-4 text-lg font-semibold text-gray-900 dark:text-zinc-100">{faq.question}</h3>
                  <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-transform duration-300 ${expandedFaq === faq.id ? 'rotate-180' : ''}`}>
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${expandedFaq === faq.id ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="px-8 pb-6">
                    <p className="leading-relaxed text-gray-600 dark:text-zinc-400">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="mb-4 text-gray-600 dark:text-zinc-400">Still have questions?</p>
            <button
              onClick={openLoginModal}
              className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-orange-600 hover:to-red-600"
            >
              Contact Support
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-24 dark:from-blue-950 dark:via-violet-950 dark:to-zinc-950">
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
        <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 dark:to-transparent"></div>
        
        {/* Animated background elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-6 border border-white/30">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              Join 10,000+ Happy Users
            </div>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Transform Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
              Rental Experience?
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of satisfied renters and property owners who have already discovered the smarter way to rent and list properties in Ethiopia.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={openSignupModal}
              className="group flex transform items-center space-x-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-purple-600 shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-gray-100 hover:shadow-white/25 dark:bg-zinc-100 dark:text-violet-800 dark:hover:bg-white dark:hover:shadow-emerald-500/20"
            >
              <span>Start Free Today</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button
              onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
              className="group border-2 border-white/30 text-white px-8 py-4 rounded-xl text-lg font-bold hover:border-white hover:bg-white/10 transition-all duration-300 flex items-center space-x-2"
            >
              <span>Learn More</span>
              <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
          
          {/* Trust badges */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-white/80">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>5-Minute Setup</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-black py-16 text-white dark:from-zinc-950 dark:to-black dark:ring-1 dark:ring-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold">EthioRent</h3>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Ethiopia's leading platform for direct property rentals. Connect with verified owners, browse premium listings, and find your perfect home without intermediaries.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all duration-300 cursor-pointer group">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all duration-300 cursor-pointer group">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all duration-300 cursor-pointer group">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Platform */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Platform</h4>
              <ul className="space-y-3">
                <li><button onClick={() => handleSmoothScroll('how-it-works')} className="text-gray-400 hover:text-white transition-colors duration-200">How it Works</button></li>
                <li><button onClick={() => handleSmoothScroll('features')} className="text-gray-400 hover:text-white transition-colors duration-200">Features</button></li>
                <li><button onClick={() => handleSmoothScroll('faq')} className="text-gray-400 hover:text-white transition-colors duration-200">FAQ</button></li>
                <li><button onClick={openSignupModal} className="text-gray-400 hover:text-white transition-colors duration-200">List Property</button></li>
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Press</a></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Contact Us</a></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors duration-200">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors duration-200">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                &copy; 2018 EthioRent. All rights reserved. Made with ❤️ in Ethiopia.
              </p>
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <Link to="/privacy" className="hover:text-white transition-colors duration-200">Privacy</Link>
                <Link to="/terms" className="hover:text-white transition-colors duration-200">Terms</Link>
                <Link to="/privacy" className="hover:text-white transition-colors duration-200">Cookies</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 z-50 flex animate-fadeIn items-center justify-center bg-black/40 p-4 backdrop-blur-sm dark:bg-black/70"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="relative w-full max-w-sm transform animate-slideUp rounded-2xl border border-gray-100 bg-white p-6 shadow-xl transition-all duration-300 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:shadow-black/50">
            {/* Animated background decoration */}
            <div className="absolute -right-16 -top-16 h-32 w-32 animate-pulse rounded-full bg-gradient-to-br from-blue-100 via-purple-50 to-transparent dark:from-blue-500/10 dark:via-purple-500/5 dark:to-transparent"></div>
            <div className="absolute -bottom-12 -left-12 h-24 w-24 animate-pulse rounded-full bg-gradient-to-tr from-purple-100 via-pink-50 to-transparent dark:from-purple-500/10 dark:via-pink-500/5 dark:to-transparent" style={{ animationDelay: '1s' }}></div>
            
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close sign in"
              className="absolute right-4 top-4 z-20 text-gray-400 transition-all duration-200 hover:rotate-90 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center mb-6 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent dark:from-blue-400 dark:to-purple-400">Welcome Back</h2>
              <p className="text-gray-600 dark:text-zinc-400">Sign in to continue to EthioRent</p>
            </div>
            
            <form onSubmit={handleLoginSubmit} className="relative z-10 space-y-5">
              {loginError && (
                <div className="animate-shake rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {loginError}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300">Phone Number</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-4 w-4 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    placeholder="09XXXXXXXX or +2519XXXXXXXX"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 transition-all duration-200 hover:border-gray-300 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-500 dark:focus:ring-blue-400"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300">Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-4 w-4 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 transition-all duration-200 hover:border-gray-300 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-500 dark:focus:ring-blue-400"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!canLoginSubmit}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loginSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
              
              <div className="border-t border-gray-100 pt-4 text-center dark:border-zinc-700">
                <span className="text-gray-600 dark:text-zinc-400">Don't have an account? </span>
                <button 
                  onClick={openSignupModal} 
                  className="font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Sign up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div 
          className="fixed inset-0 z-50 flex animate-fadeIn items-center justify-center bg-black/40 p-4 backdrop-blur-sm dark:bg-black/70"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="relative w-full max-w-sm transform animate-slideUp rounded-2xl border border-gray-100 bg-white p-5 shadow-xl transition-all duration-300 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-2xl dark:shadow-black/50">
            {/* Animated background decoration */}
            <div className="absolute -right-16 -top-16 h-32 w-32 animate-pulse rounded-full bg-gradient-to-br from-green-100 via-emerald-50 to-transparent dark:from-emerald-500/10 dark:via-cyan-500/5 dark:to-transparent"></div>
            <div className="absolute -bottom-12 -left-12 h-24 w-24 animate-pulse rounded-full bg-gradient-to-tr from-blue-100 via-cyan-50 to-transparent dark:from-blue-500/10 dark:via-cyan-500/5 dark:to-transparent" style={{ animationDelay: '1s' }}></div>
            
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close sign up"
              className="absolute right-4 top-4 z-20 text-gray-400 transition-all duration-200 hover:rotate-90 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center mb-4 relative z-10">
              <div className="w-14 h-14 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="mb-1 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-xl font-bold text-transparent dark:from-emerald-400 dark:to-blue-400">Create Account</h2>
              <p className="text-sm text-gray-600 dark:text-zinc-400">Join our community today</p>
            </div>
            
            <form onSubmit={handleSignupSubmit} className="relative z-10 space-y-3">
              {signupError && (
                <div className="animate-shake rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {signupError}
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-3 w-3 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={signupData.full_name}
                    onChange={(e) => setSignupData({...signupData, full_name: e.target.value})}
                    className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm transition-all duration-200 hover:border-gray-300 focus:border-transparent focus:ring-2 focus:ring-green-500 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:border-zinc-500 dark:focus:ring-emerald-500/60"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-3 w-3 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    placeholder="09XXXXXXXX or +2519XXXXXXXX"
                    value={signupData.identifier}
                    onChange={(e) => setSignupData({...signupData, identifier: e.target.value})}
                    className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm transition-all duration-200 hover:border-gray-300 focus:border-transparent focus:ring-2 focus:ring-green-500 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:border-zinc-500 dark:focus:ring-emerald-500/60"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">Role</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-3 w-3 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <select 
                    value={signupData.role}
                    onChange={(e) => setSignupData({...signupData, role: e.target.value})}
                    className="w-full appearance-none rounded-lg border border-gray-200 py-2 pl-8 pr-8 text-sm transition-all duration-200 hover:border-gray-300 focus:border-transparent focus:ring-2 focus:ring-green-500 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:border-zinc-500 dark:focus:ring-emerald-500/60"
                  >
                    <option value="">Select your role</option>
                    <option value="renter">Renter</option>
                    <option value="owner">Property Owner</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-3 w-3 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-3 w-3 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    value={signupData.password}
                    onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                    className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm transition-all duration-200 hover:border-gray-300 focus:border-transparent focus:ring-2 focus:ring-green-500 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:border-zinc-500 dark:focus:ring-emerald-500/60"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-3 w-3 text-gray-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    value={signupData.confirm_password}
                    onChange={(e) => setSignupData({...signupData, confirm_password: e.target.value})}
                    className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm transition-all duration-200 hover:border-gray-300 focus:border-transparent focus:ring-2 focus:ring-green-500 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:border-zinc-500 dark:focus:ring-emerald-500/60"
                  />
                </div>
              </div>
              
              <div className="flex items-start space-x-2 rounded-lg border border-gray-100 bg-white p-2 dark:border-transparent dark:bg-zinc-800/60">
                <input 
                  type="checkbox" 
                  checked={signupData.terms || false}
                  onChange={(e) => setSignupData({...signupData, terms: e.target.checked})}
                  className="mt-0.5 h-3 w-3 rounded border-gray-300 text-green-600 focus:ring-green-500 dark:border-zinc-500 dark:bg-zinc-800 dark:text-emerald-400 dark:focus:ring-emerald-500/50" 
                />
                <span className="text-xs leading-relaxed text-gray-600 dark:text-zinc-400">
                  I agree to{' '}
                  <Link to="/terms" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                    Privacy Policy
                  </Link>
                </span>
              </div>
              
              <button
                type="submit"
                disabled={signupSubmitting}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm"
              >
                {signupSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
              
              <div className="border-t border-gray-100 pt-2 text-center dark:border-zinc-700">
                <span className="text-xs text-gray-600 dark:text-zinc-400">Already have an account? </span>
                <button 
                  onClick={openLoginModal} 
                  className="text-xs font-semibold text-green-600 transition-colors duration-200 hover:text-green-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Landing;

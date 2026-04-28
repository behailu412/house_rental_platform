import React, { useEffect, useMemo, useState } from 'react';
import PropertyList from './property_list.jsx';
import PropertyForm from './property_form.jsx';
import ChatComponent from './chat_component.jsx';
import ChatInbox from './chat_inbox.jsx';
import ComplaintForm from './complaint_form.jsx';
import { LayoutDashboard, PlusCircle, MessageSquare, Home, HelpCircle, BarChart3, X, Menu, Building, CheckCircle, Clock, Eye, Settings, BookOpen, Moon, Sun, Save, ShieldCheck, Search, Heart, User, BookOpen as Guide, HeadphonesIcon } from 'lucide-react';

// Small local helper: avoid repeating auth logic; if missing, we still render basic UI.
import { getApiBase } from './api.js';
import { readStoredUser, writeStoredUser } from './authStorage.js';
import { useI18n } from './i18n.jsx';

function Cover({ src, alt }) {
  if (!src) {
    return <div className="aspect-[4/3] w-full rounded bg-gray-100" />;
  }
  return <img src={src} alt={alt} className="aspect-[4/3] w-full rounded object-cover" />;
}

function FavoritesCard({ item, onRemove }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:border-blue-200">
      {/* Favorite Badge */}
      <div className="absolute top-3 right-3 z-10">
        <div className="rounded-full bg-gradient-to-r from-pink-500 to-red-500 p-2 shadow-lg">
          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Property Image */}
      <div className="relative h-48 overflow-hidden">
        <Cover src={item.cover_photo} alt={item.real_address} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Property Details */}
      <div className="p-4">
        {/* Location */}
        <div className="flex items-center gap-2 mb-2">
          <div className="rounded-lg bg-blue-100 p-1.5">
            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{item.city}</h3>
            <p className="text-xs text-gray-600">{item.subcity}</p>
          </div>
        </div>

        {/* Address */}
        <div className="mb-3">
          <p className="text-xs text-gray-600 line-clamp-2 flex items-start gap-2">
            <svg className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>{item.real_address}</span>
          </p>
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900">{Number(item.price).toLocaleString()}</span>
            <span className="text-xs text-gray-500">ETB/month</span>
          </div>
          <button
            className="group/btn rounded-xl bg-gradient-to-r from-red-500 to-pink-600 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-all duration-300 hover:from-red-600 hover:to-pink-700 hover:shadow-red-500/25 hover:scale-105"
            onClick={() => onRemove(item.property_id)}
          >
            <div className="flex items-center gap-1.5">
              <svg className="h-3 w-3 transition-transform duration-300 group-hover/btn:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Remove</span>
            </div>
          </button>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(() => readStoredUser());
  const { t } = useI18n();

  // renter: favorites and discovery
  // owner: my properties + listing form
  // admin: admin panel is separate route; dashboard mostly for others
  const apiBase = useMemo(() => getApiBase(), []);

  const [favorites, setFavorites] = useState([]);
  const [myProperties, setMyProperties] = useState([]);
  const [chatState, setChatState] = useState(null); // { withUserId, propertyId }
  const [showChatInbox, setShowChatInbox] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [notificationPropertyId, setNotificationPropertyId] = useState(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [ownerTab, setOwnerTab] = useState('overview');
  const [ownerSidebarOpen, setOwnerSidebarOpen] = useState(true);
  const [ownerSidebarCollapsed, setOwnerSidebarCollapsed] = useState(false);
  const [messagesTabClickCount, setMessagesTabClickCount] = useState(0);
  const [editingRepostProperty, setEditingRepostProperty] = useState(null);
  const [repostLoadingId, setRepostLoadingId] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [ownerActionError, setOwnerActionError] = useState('');
  
  // Renter sidebar state
  const [renterTab, setRenterTab] = useState('discover');
  const [renterSidebarOpen, setRenterSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('hrp_renter_dark_mode') === '1');
  const [settingsName, setSettingsName] = useState(() => readStoredUser()?.full_name || '');
  const [settingsCurrentPassword, setSettingsCurrentPassword] = useState('');
  const [settingsNewPassword, setSettingsNewPassword] = useState('');
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [ownerDarkMode, setOwnerDarkMode] = useState(() => localStorage.getItem('hrp_owner_dark_mode') === '1');
  const [ownerSettingsName, setOwnerSettingsName] = useState(() => readStoredUser()?.full_name || '');
  const [ownerSettingsCurrentPassword, setOwnerSettingsCurrentPassword] = useState('');
  const [ownerSettingsNewPassword, setOwnerSettingsNewPassword] = useState('');
  const [ownerSettingsConfirmPassword, setOwnerSettingsConfirmPassword] = useState('');
  const [ownerSettingsLoading, setOwnerSettingsLoading] = useState(false);
  const [ownerSettingsError, setOwnerSettingsError] = useState('');
  const [ownerSettingsSuccess, setOwnerSettingsSuccess] = useState('');

  const role = user?.role;
  const chatDarkMode = role === 'owner' ? ownerDarkMode : darkMode;

  const refreshFavorites = async () => {
    if (!user) return;
    const res = await fetch(`${apiBase}/favorites.php?action=list`, { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (data.ok) setFavorites(data.items || []);
  };

  const refreshMyProperties = async () => {
    if (!user) return;
    const res = await fetch(`${apiBase}/properties.php?action=my_properties`, { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (data.ok) setMyProperties(data.items || []);
  };

  useEffect(() => {
    if (!user) return;
    refreshFavorites();
    if (role === 'owner') refreshMyProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  useEffect(() => {
    if (role === 'renter') {
      setSettingsName(user?.full_name || '');
    }
  }, [role, user]);

  useEffect(() => {
    if (role === 'owner') {
      setOwnerSettingsName(user?.full_name || '');
    }
  }, [role, user]);

  useEffect(() => {
    const activeDarkMode = role === 'owner' ? ownerDarkMode : darkMode;
    if (activeDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode, ownerDarkMode, role]);

  useEffect(() => {
    localStorage.setItem('hrp_renter_dark_mode', darkMode ? '1' : '0');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('hrp_owner_dark_mode', ownerDarkMode ? '1' : '0');
  }, [ownerDarkMode]);

  useEffect(() => {
    if (!user) return undefined;
    const fetchUnreadSummary = async () => {
      try {
        const res = await fetch(`${apiBase}/chat.php?action=unread_summary`, { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok === true) {
          setChatUnreadCount(Number(data.unread_total || 0));
        }
      } catch {
        // ignore polling errors
      }
    };

    void fetchUnreadSummary();
    const timer = setInterval(() => void fetchUnreadSummary(), 2000);
    return () => clearInterval(timer);
  }, [apiBase, user]);

  // Auto-open chat inbox when Messages tab is selected or clicked again
  useEffect(() => {
    if (ownerTab === 'messages' && role === 'owner') {
      setShowChatInbox(true);
    }
  }, [ownerTab, role, messagesTabClickCount]);

  // Auto-open chat inbox when Messages tab is selected for renters
  useEffect(() => {
    if (renterTab === 'messages' && role === 'renter') {
      setShowChatInbox(true);
    }
  }, [renterTab, role]);

  // Listen for property detail open events from notifications
  useEffect(() => {
    const handleOpenPropertyDetail = (event) => {
      const { propertyId } = event.detail;
      setNotificationPropertyId(propertyId);
    };

    window.addEventListener('openPropertyDetail', handleOpenPropertyDetail);
    return () => window.removeEventListener('openPropertyDetail', handleOpenPropertyDetail);
  }, []);

  // Listen for renter sidebar toggle events from TopBar
  useEffect(() => {
    const handleToggleRenterSidebar = () => {
      setRenterSidebarOpen((v) => !v);
    };

    window.addEventListener('toggleRenterSidebar', handleToggleRenterSidebar);
    return () => window.removeEventListener('toggleRenterSidebar', handleToggleRenterSidebar);
  }, []);

  const removeFavorite = async (propertyId) => {
    await fetch(`${apiBase}/favorites.php?action=remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ property_id: propertyId }),
    });
    setFavorites((prev) => prev.filter((x) => x.property_id !== propertyId));
  };

  const markRented = async (propertyId) => {
    await fetch(`${apiBase}/properties.php?action=set_rented`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ property_id: propertyId }),
    });
    refreshMyProperties();
  };

  const deleteProperty = async (propertyId) => {
    setOwnerActionError('');
    setDeleteLoadingId(propertyId);
    try {
      const res = await fetch(`${apiBase}/properties.php?action=delete_mine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ property_id: propertyId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok !== true) {
        setOwnerActionError(data.error || 'Failed to delete listing');
        return;
      }
      if (editingRepostProperty?.id === propertyId) {
        setEditingRepostProperty(null);
      }
      await refreshMyProperties();
    } catch {
      setOwnerActionError('Network error while deleting listing.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const startRepost = async (propertyId) => {
    setOwnerActionError('');
    setRepostLoadingId(propertyId);
    try {
      const res = await fetch(`${apiBase}/properties.php?action=owner_property_detail&property_id=${encodeURIComponent(propertyId)}`, {
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok !== true) {
        setOwnerActionError(data.error || 'Failed to load listing for repost');
        return;
      }
      setEditingRepostProperty(data.item || null);
    } catch {
      setOwnerActionError('Network error while preparing repost.');
    } finally {
      setRepostLoadingId(null);
    }
  };

  const ownerStats = useMemo(() => {
    const total = myProperties.length;
    const active = myProperties.filter((p) => p.status === 'active').length;
    const pending = myProperties.filter((p) => p.status === 'pending').length;
    const totalViews = myProperties.reduce((sum, p) => sum + (p.views_count || 0), 0);
    return { total, active, pending, totalViews };
  }, [myProperties]);

  const ownerTabs = [
    { id: 'overview', label: t('Overview'), icon: LayoutDashboard, color: 'blue' },
    { id: 'new_listing', label: t('Post a New Listing'), icon: PlusCircle, color: 'emerald' },
    { id: 'messages', label: t('Messages'), icon: MessageSquare, color: 'sky' },
    { id: 'my_properties', label: t('My Properties'), icon: Home, color: 'amber' },
    { id: 'settings', label: t('Settings'), icon: Settings, color: 'slate' },
    { id: 'guide', label: t('Guide'), icon: BookOpen, color: 'purple' },
    { id: 'support', label: t('Help & Support'), icon: HelpCircle, color: 'rose' },
  ];

  const renterTabs = [
    { id: 'discover', label: t('Discover Homes'), icon: Search },
    { id: 'messages', label: t('Messages'), icon: MessageSquare },
    { id: 'favorites', label: t('Favorites'), icon: Heart },
    { id: 'settings', label: t('Settings'), icon: Settings },
    { id: 'guide', label: t('Guide'), icon: Guide },
    { id: 'support', label: t('Help & Support'), icon: HeadphonesIcon },
  ];

  const submitProfileSettings = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    const trimmedName = settingsName.trim();
    if (trimmedName.length < 2) {
      setSettingsError('Full name must be at least 2 characters.');
      return;
    }

    const wantsPasswordChange = settingsCurrentPassword || settingsNewPassword || settingsConfirmPassword;
    if (wantsPasswordChange) {
      if (!settingsCurrentPassword || !settingsNewPassword || !settingsConfirmPassword) {
        setSettingsError('Please fill all password fields to change password.');
        return;
      }
      if (settingsNewPassword.length < 6) {
        setSettingsError('New password must be at least 6 characters.');
        return;
      }
      if (settingsNewPassword !== settingsConfirmPassword) {
        setSettingsError('New password and confirm password do not match.');
        return;
      }
    }

    setSettingsLoading(true);
    try {
      const resProfile = await fetch(`${apiBase}/me.php?action=update_profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ full_name: trimmedName }),
      });
      const profileData = await resProfile.json().catch(() => ({}));
      if (!resProfile.ok || profileData.ok !== true) {
        setSettingsError(profileData.error || 'Failed to update profile.');
        return;
      }

      if (profileData.user) {
        setUser(profileData.user);
        writeStoredUser(profileData.user);
      }

      if (wantsPasswordChange) {
        const resPass = await fetch(`${apiBase}/me.php?action=change_password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            current_password: settingsCurrentPassword,
            new_password: settingsNewPassword,
          }),
        });
        const passData = await resPass.json().catch(() => ({}));
        if (!resPass.ok || passData.ok !== true) {
          setSettingsError(passData.error || 'Failed to change password.');
          return;
        }
      }

      setSettingsCurrentPassword('');
      setSettingsNewPassword('');
      setSettingsConfirmPassword('');
      setSettingsSuccess(wantsPasswordChange ? 'Profile and password updated successfully.' : 'Profile updated successfully.');
    } catch {
      setSettingsError('Network error while saving settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const submitOwnerSettings = async (e) => {
    e.preventDefault();
    setOwnerSettingsError('');
    setOwnerSettingsSuccess('');

    const trimmedName = ownerSettingsName.trim();
    if (trimmedName.length < 2) {
      setOwnerSettingsError('Full name must be at least 2 characters.');
      return;
    }

    const wantsPasswordChange = ownerSettingsCurrentPassword || ownerSettingsNewPassword || ownerSettingsConfirmPassword;
    if (wantsPasswordChange) {
      if (!ownerSettingsCurrentPassword || !ownerSettingsNewPassword || !ownerSettingsConfirmPassword) {
        setOwnerSettingsError('Please fill all password fields to change password.');
        return;
      }
      if (ownerSettingsNewPassword.length < 6) {
        setOwnerSettingsError('New password must be at least 6 characters.');
        return;
      }
      if (ownerSettingsNewPassword !== ownerSettingsConfirmPassword) {
        setOwnerSettingsError('New password and confirm password do not match.');
        return;
      }
    }

    setOwnerSettingsLoading(true);
    try {
      const resProfile = await fetch(`${apiBase}/me.php?action=update_profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ full_name: trimmedName }),
      });
      const profileData = await resProfile.json().catch(() => ({}));
      if (!resProfile.ok || profileData.ok !== true) {
        setOwnerSettingsError(profileData.error || 'Failed to update profile.');
        return;
      }

      if (profileData.user) {
        setUser(profileData.user);
        writeStoredUser(profileData.user);
      }

      if (wantsPasswordChange) {
        const resPass = await fetch(`${apiBase}/me.php?action=change_password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            current_password: ownerSettingsCurrentPassword,
            new_password: ownerSettingsNewPassword,
          }),
        });
        const passData = await resPass.json().catch(() => ({}));
        if (!resPass.ok || passData.ok !== true) {
          setOwnerSettingsError(passData.error || 'Failed to change password.');
          return;
        }
      }

      setOwnerSettingsCurrentPassword('');
      setOwnerSettingsNewPassword('');
      setOwnerSettingsConfirmPassword('');
      setOwnerSettingsSuccess(wantsPasswordChange ? 'Profile and password updated successfully.' : 'Profile updated successfully.');
    } catch {
      setOwnerSettingsError('Network error while saving settings.');
    } finally {
      setOwnerSettingsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        Please login.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {role === 'renter' ? (
        <div className={`renter-console relative min-h-[calc(100vh-5rem)] ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-slate-50 to-blue-50/30'}`}>
          <aside className={`hidden border-r border-gray-200 bg-white md:fixed md:bottom-0 md:left-0 md:top-20 md:block md:overflow-y-auto md:shadow-lg transition-all duration-300 ease-in-out ${
            renterSidebarOpen ? 'md:w-[280px]' : 'md:w-[60px]'
          }`}>
              <div className="border-b border-gray-200 bg-gradient-to-r from-slate-700 to-slate-900 text-white">
                <div className={`flex items-center justify-center px-3 py-4 ${renterSidebarOpen ? 'px-6 justify-between' : 'px-3 justify-center'}`}>
                  {renterSidebarOpen && (
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                        <Home className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold tracking-tight">Renter Console</h2>
                        <p className="text-xs text-blue-100">Find your perfect home</p>
                      </div>
                    </div>
                  )}
                  {!renterSidebarOpen && (
                    <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                      <Home className="h-6 w-6" />
                    </div>
                  )}
                  {renterSidebarOpen && (
                    <button
                      onClick={() => setRenterSidebarOpen(false)}
                      className="hidden md:flex rounded-lg bg-white/20 hover:bg-white/30 p-2 backdrop-blur-sm transition-all duration-200 group"
                      title="Hide sidebar"
                    >
                      <svg className="h-5 w-5 text-white group-hover:text-blue-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <nav className={`space-y-2 ${renterSidebarOpen ? 'p-4' : 'p-2'}`}>
                {renterTabs.map((tab) => {
                  const Icon = tab.icon;
                  const getIconColor = (tabId, isActive) => {
                    if (isActive) return 'text-white';
                    
                    switch(tabId) {
                      case 'discover': return 'text-emerald-500 group-hover:text-emerald-600';
                      case 'messages': return 'text-blue-500 group-hover:text-blue-600';
                      case 'favorites': return 'text-red-500 group-hover:text-red-600';
                      case 'settings': return 'text-gray-500 group-hover:text-gray-600';
                      case 'guide': return 'text-purple-500 group-hover:text-purple-600';
                      case 'support': return 'text-orange-500 group-hover:text-orange-600';
                      default: return 'text-gray-500 group-hover:text-gray-600';
                    }
                  };
                  
                  const getIconBg = (tabId, isActive) => {
                    if (isActive) return 'bg-white/20';
                    
                    switch(tabId) {
                      case 'discover': return 'bg-emerald-50 group-hover:bg-emerald-100';
                      case 'messages': return 'bg-blue-50 group-hover:bg-blue-100';
                      case 'favorites': return 'bg-red-50 group-hover:bg-red-100';
                      case 'settings': return 'bg-gray-50 group-hover:bg-gray-100';
                      case 'guide': return 'bg-purple-50 group-hover:bg-purple-100';
                      case 'support': return 'bg-orange-50 group-hover:bg-orange-100';
                      default: return 'bg-gray-50 group-hover:bg-gray-100';
                    }
                  };
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setRenterTab(tab.id);
                      }}
                      className={`group relative w-full rounded-lg text-left text-sm font-medium transition-all duration-200 ${
                        renterSidebarOpen ? 'px-4 py-3' : 'px-2 py-3'
                      } ${
                        renterTab === tab.id 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      title={!renterSidebarOpen ? tab.label : ''}
                    >
                      <div className={`flex items-center ${renterSidebarOpen ? 'gap-3' : 'justify-center'}`}>
                        <div className={`rounded-lg p-1.5 transition-all duration-200 ${getIconBg(tab.id, renterTab === tab.id)}`}>
                          <Icon className={`h-5 w-5 transition-colors ${getIconColor(tab.id, renterTab === tab.id)}`} />
                        </div>
                        {renterSidebarOpen && (
                          <span className="font-medium">{tab.label}</span>
                        )}
                        {renterSidebarOpen && tab.id === 'messages' && chatUnreadCount > 0 && (
                          <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg">
                            {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                          </span>
                        )}
                        {!renterSidebarOpen && tab.id === 'messages' && chatUnreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white shadow-lg">
                            {chatUnreadCount > 99 ? '9+' : chatUnreadCount}
                          </span>
                        )}
                      </div>
                      {renterSidebarOpen && renterTab === tab.id && (
                        <div className="absolute inset-y-0 right-2 flex items-center">
                          <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </nav>
          </aside>

            <div className={`min-w-0 transition-all duration-300 ease-in-out ${
              renterSidebarOpen ? 'md:ml-[280px]' : 'md:ml-[60px]'
            }`}>

              {/* Floating toggle button for desktop when sidebar is collapsed */}
              {!renterSidebarOpen && (
                <button
                  onClick={() => setRenterSidebarOpen(true)}
                  className="hidden md:flex fixed left-[68px] top-24 z-40 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 p-2 shadow-lg transition-all duration-200 group"
                  title="Expand sidebar"
                >
                  <svg className="h-4 w-4 text-white group-hover:text-blue-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {renterSidebarOpen ? (
                <div className="border-b border-slate-200/60 bg-white/95 backdrop-blur-sm p-2 md:hidden shadow-lg">
                  <nav className="grid gap-2">
                    {renterTabs.map((tab) => {
                      const Icon = tab.icon;
                      const getIconColor = (tabId, isActive) => {
                        if (isActive) return 'text-white';
                        
                        switch(tabId) {
                          case 'discover': return 'text-emerald-600';
                          case 'messages': return 'text-blue-600';
                          case 'favorites': return 'text-red-500';
                          case 'settings': return 'text-slate-600';
                          case 'guide': return 'text-purple-600';
                          case 'support': return 'text-orange-600';
                          default: return 'text-slate-500';
                        }
                      };
                      
                      const getIconBg = (tabId, isActive) => {
                        if (isActive) return 'bg-white/20';
                        
                        switch(tabId) {
                          case 'discover': return 'bg-emerald-100';
                          case 'messages': return 'bg-blue-100';
                          case 'favorites': return 'bg-red-100';
                          case 'settings': return 'bg-slate-100';
                          case 'guide': return 'bg-purple-100';
                          case 'support': return 'bg-orange-100';
                          default: return 'bg-slate-100';
                        }
                      };
                      
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setRenterTab(tab.id);
                            setRenterSidebarOpen(false);
                          }}
                          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
                            renterTab === tab.id 
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className={`rounded-lg p-1.5 transition-all duration-200 ${getIconBg(tab.id, renterTab === tab.id)}`}>
                            <Icon className={`h-5 w-5 transition-colors ${getIconColor(tab.id, renterTab === tab.id)}`} />
                          </div>
                          <span className="font-medium">{tab.label}</span>
                          {tab.id === 'messages' && chatUnreadCount > 0 && (
                            <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg">
                              {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              ) : null}

              <div className="space-y-4 p-2 md:p-4">
                {renterTab === 'discover' ? (
                  <div>

                    <div className="mt-4">
                      <PropertyList
                        onChat={(payload) => setChatState(payload)}
                        onFavoriteChanged={refreshFavorites}
                        notificationPropertyId={notificationPropertyId}
                        onNotificationHandled={() => setNotificationPropertyId(null)}
                        darkMode={darkMode}
                      />
                    </div>
                  </div>
                ) : null}

                {renterTab === 'messages' ? (
                  <div className={`rounded-xl border p-4 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h2 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{t('Messages')}</h2>
                        <p className={`mt-1 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>{t('Private real-time chat with owners.')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowChatInbox(true)}
                        className={`relative rounded-md px-4 py-2 text-sm font-semibold text-white ${
                          darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {t('Open Inbox')}
                        {chatUnreadCount > 0 ? (
                          <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {chatUnreadCount}
                          </span>
                        ) : null}
                      </button>
                    </div>
                  </div>
                ) : null}

                {renterTab === 'favorites' ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold">{t('Favorites')}</h2>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {favorites.length === 0 ? (
                        <div className="text-sm text-gray-500">{t('No favorites yet.')}</div>
                      ) : (
                        favorites.map((f) => (
                          <FavoritesCard key={f.property_id} item={f} onRemove={removeFavorite} />
                        ))
                      )}
                    </div>
                  </div>
                ) : null}

                {renterTab === 'support' ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{t('Help & Support')}</h2>
                    </div>
                    <div className="mt-3">
                      <div className={`rounded-lg border p-4 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                        <h3 className={`mb-2 font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{t('Report an Issue or Share Feedback')}</h3>
                        <p className={`mb-4 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                          {t('Having problems with the platform? Want to share your experience or suggestions? We\'re here to help.')}
                        </p>
                        <button
                          onClick={() => setShowComplaintForm(true)}
                          className={`w-full sm:w-auto rounded-md px-4 py-2 text-sm font-semibold text-white ${
                            darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {t('Submit Complaint or Feedback')}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {renterTab === 'settings' ? (
                  <div className="space-y-4">
                    <div className={`rounded-xl border p-4 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h2 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{t('Settings')}</h2>
                          <p className={`mt-1 text-sm ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                            {t('Update your account details and personalize your renter experience.')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDarkMode((v) => !v)}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                            darkMode
                              ? 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                          {darkMode ? t('Light Mode') : t('Dark Mode')}
                        </button>
                      </div>
                    </div>

                    <form onSubmit={submitProfileSettings} className={`rounded-xl border p-4 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                      <h3 className={`mb-4 text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{t('Account Settings')}</h3>
                      <div className="grid gap-4">
                        <div>
                          <label className={`mb-1 block text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{t('Full Name')}</label>
                          <input
                            value={settingsName}
                            onChange={(e) => setSettingsName(e.target.value)}
                            className={`w-full rounded-lg border px-3 py-2 text-sm ${
                              darkMode
                                ? 'border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-400'
                                : 'border-gray-300 bg-white text-slate-900'
                            }`}
                            placeholder={t('Your full name')}
                          />
                        </div>

                        <div className="rounded-lg border border-dashed border-indigo-300/60 p-3">
                          <p className={`mb-3 flex items-center gap-2 text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            <ShieldCheck className="h-4 w-4 text-indigo-500" />
                            {t('Change Password')}
                          </p>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <input
                              type="password"
                              value={settingsCurrentPassword}
                              onChange={(e) => setSettingsCurrentPassword(e.target.value)}
                              className={`rounded-lg border px-3 py-2 text-sm ${
                                darkMode
                                  ? 'border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-400'
                                  : 'border-gray-300 bg-white text-slate-900'
                              }`}
                              placeholder={t('Current password')}
                            />
                            <input
                              type="password"
                              value={settingsNewPassword}
                              onChange={(e) => setSettingsNewPassword(e.target.value)}
                              className={`rounded-lg border px-3 py-2 text-sm ${
                                darkMode
                                  ? 'border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-400'
                                  : 'border-gray-300 bg-white text-slate-900'
                              }`}
                              placeholder={t('New password')}
                            />
                            <input
                              type="password"
                              value={settingsConfirmPassword}
                              onChange={(e) => setSettingsConfirmPassword(e.target.value)}
                              className={`rounded-lg border px-3 py-2 text-sm ${
                                darkMode
                                  ? 'border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-400'
                                  : 'border-gray-300 bg-white text-slate-900'
                              }`}
                              placeholder={t('Confirm new password')}
                            />
                          </div>
                        </div>

                        {settingsError ? (
                          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{settingsError}</div>
                        ) : null}
                        {settingsSuccess ? (
                          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{settingsSuccess}</div>
                        ) : null}

                        <button
                          type="submit"
                          disabled={settingsLoading}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          <Save className="h-4 w-4" />
                          {settingsLoading ? t('Saving...') : t('Save Settings')}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : null}

                {renterTab === 'guide' ? (
                  <div className={`rounded-2xl border p-6 shadow-sm ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-slate-800'}`}>
                    <div className="mb-5 flex items-center gap-3">
                      <div className="rounded-xl bg-blue-600/10 p-2">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{t('Renter Guide')}</h2>
                        <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          {t('Your complete resource for finding and securing the perfect rental home.')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6 text-sm leading-relaxed">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-blue-600">{t('Getting Started')}</h3>
                        <p>
                          {t('Welcome to your comprehensive renter dashboard. Our platform is designed to streamline your rental search by providing verified listings, direct owner communication, and powerful tools to manage your housing journey-all in one centralized location.')}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-500">{t('🏠 Discover Homes')}</h4>
                        <p>
                          {t('Begin your search by exploring our curated collection of active rental listings. Utilize our advanced filtering system to narrow properties by location, type, and specific requirements. Click into any property to access detailed information including pricing, amenities, neighborhood insights, and owner contact details.')}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-500">{t('💬 Messages')}</h4>
                        <p>
                          {t('Engage directly with property owners through our secure messaging platform. Discuss availability, rental terms, utility arrangements, and move-in timelines. The real-time chat system ensures prompt communication, while unread message indicators help you stay informed of all important responses.')}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-500">{t('❤️ Favorites')}</h4>
                        <p>
                          {t('Save properties that interest you to your personal favorites collection. This feature enables efficient comparison of multiple options and creates a convenient shortlist, eliminating the need to repeat searches and helping you make informed decisions.')}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-500">{t('⚙️ Settings')}</h4>
                        <p>
                          {t('Personalize your experience by updating your profile information, modifying security credentials, and toggling between light and dark display modes for optimal viewing comfort during any time of day.')}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-500">{t('🆘 Help & Support')}</h4>
                        <p>
                          {t('Access comprehensive support whenever you encounter technical issues or wish to provide feedback. Your input is valuable for enhancing platform functionality and maintaining a safe, reliable rental environment for all users.')}
                        </p>
                      </div>

                      <div className={`mt-6 p-4 rounded-xl border ${
                        darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <h4 className={`font-semibold mb-2 ${
                          darkMode ? 'text-blue-400' : 'text-blue-700'
                        }`}>{t('💡 Pro Tips for Success')}</h4>
                        <p className={`${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                          {t('Maximize your rental search efficiency by:')}<br/>
                          {t('1) Shortlisting promising properties in Favorites')}<br/>
                          {t('2) Initiating conversations with multiple owners')}<br/>
                          {t('3) Carefully comparing responses and terms')}<br/>
                          {t('4) Selecting the property that best aligns with your budget, location preferences, and lifestyle requirements.')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
        </div>
      ) : null}

      {role === 'owner' ? (
        <div className={`owner-console relative min-h-[calc(100vh-5rem)] ${ownerDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-slate-50 to-blue-50/30'}`}>
          <aside className={`hidden border-r border-gray-200 bg-white md:fixed md:bottom-0 md:left-0 md:top-20 md:block md:overflow-y-auto md:shadow-lg transition-all duration-300 ease-in-out ${
            ownerSidebarCollapsed ? 'md:w-[60px]' : 'md:w-[280px]'
          }`}>
              <div className="border-b border-gray-200 bg-gradient-to-r from-slate-700 to-slate-900 text-white">
                <div className={`flex items-center px-3 py-4 ${ownerSidebarCollapsed ? 'justify-center' : 'justify-between px-6'}`}>
                  {!ownerSidebarCollapsed && (
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                        <Home className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold tracking-tight">Owner Console</h2>
                        <p className="text-xs text-blue-100">Manage your rental business</p>
                      </div>
                    </div>
                  )}
                  {ownerSidebarCollapsed && (
                    <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                      <Home className="h-6 w-6" />
                    </div>
                  )}
                  {!ownerSidebarCollapsed && (
                    <button
                      onClick={() => setOwnerSidebarCollapsed(true)}
                      className="hidden md:flex rounded-lg bg-white/20 hover:bg-white/30 p-2 backdrop-blur-sm transition-all duration-200 group"
                      title="Hide sidebar"
                    >
                      <svg className="h-5 w-5 text-white group-hover:text-blue-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <nav className={`space-y-2 ${ownerSidebarCollapsed ? 'p-2' : 'p-4'}`}>
                {ownerTabs.map((tab) => {
                  const Icon = tab.icon;
                  const getIconColor = (tabColor, isActive) => {
                    if (isActive) return 'text-white';
                    
                    switch(tabColor) {
                      case 'blue': return 'text-blue-500 group-hover:text-blue-600';
                      case 'emerald': return 'text-emerald-500 group-hover:text-emerald-600';
                      case 'sky': return 'text-sky-500 group-hover:text-sky-600';
                      case 'amber': return 'text-amber-500 group-hover:text-amber-600';
                      case 'slate': return 'text-slate-500 group-hover:text-slate-600';
                      case 'purple': return 'text-purple-500 group-hover:text-purple-600';
                      case 'rose': return 'text-rose-500 group-hover:text-rose-600';
                      default: return 'text-slate-500 group-hover:text-slate-600';
                    }
                  };
                  
                  const getIconBg = (tabColor, isActive) => {
                    if (isActive) return 'bg-white/20';
                    
                    switch(tabColor) {
                      case 'blue': return 'bg-blue-50 group-hover:bg-blue-100';
                      case 'emerald': return 'bg-emerald-50 group-hover:bg-emerald-100';
                      case 'sky': return 'bg-sky-50 group-hover:bg-sky-100';
                      case 'amber': return 'bg-amber-50 group-hover:bg-amber-100';
                      case 'slate': return 'bg-slate-50 group-hover:bg-slate-100';
                      case 'purple': return 'bg-purple-50 group-hover:bg-purple-100';
                      case 'rose': return 'bg-rose-50 group-hover:bg-rose-100';
                      default: return 'bg-slate-50 group-hover:bg-slate-100';
                    }
                  };

                  const getActiveGradient = (tabColor) => {
                    switch(tabColor) {
                      case 'blue': return 'from-blue-600 to-indigo-600 shadow-blue-500/25';
                      case 'emerald': return 'from-emerald-600 to-teal-600 shadow-emerald-500/25';
                      case 'sky': return 'from-sky-600 to-blue-600 shadow-sky-500/25';
                      case 'amber': return 'from-amber-600 to-orange-600 shadow-amber-500/25';
                      case 'slate': return 'from-slate-600 to-gray-600 shadow-slate-500/25';
                      case 'purple': return 'from-purple-600 to-indigo-600 shadow-purple-500/25';
                      case 'rose': return 'from-rose-600 to-pink-600 shadow-rose-500/25';
                      default: return 'from-blue-600 to-indigo-600 shadow-blue-500/25';
                    }
                  };
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                      setOwnerTab(tab.id);
                      if (tab.id === 'messages') {
                        setMessagesTabClickCount(prev => prev + 1);
                      }
                    }}
                      className={`group relative w-full rounded-lg text-left text-sm font-medium transition-all duration-200 ${
                        ownerSidebarCollapsed ? 'px-2 py-3' : 'px-4 py-3'
                      } ${
                        ownerTab === tab.id 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      title={ownerSidebarCollapsed ? tab.label : ''}
                    >
                      <div className={`flex items-center ${ownerSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                        <div className={`rounded-lg p-1.5 transition-all duration-200 ${getIconBg(tab.color, ownerTab === tab.id)}`}>
                          <Icon className={`h-5 w-5 transition-colors ${getIconColor(tab.color, ownerTab === tab.id)}`} />
                        </div>
                        {!ownerSidebarCollapsed && (
                          <span className="font-medium">{tab.label}</span>
                        )}
                        {!ownerSidebarCollapsed && tab.id === 'messages' && chatUnreadCount > 0 && (
                          <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg">
                            {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                          </span>
                        )}
                        {ownerSidebarCollapsed && tab.id === 'messages' && chatUnreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white shadow-lg">
                            {chatUnreadCount > 99 ? '9+' : chatUnreadCount}
                          </span>
                        )}
                      </div>
                      {!ownerSidebarCollapsed && ownerTab === tab.id && (
                        <div className="absolute inset-y-0 right-2 flex items-center">
                          <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        </div>
                      )}
                    </button>
                  );
                })}
                
                {/* Expand button when collapsed */}
                {ownerSidebarCollapsed && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setOwnerSidebarCollapsed(false)}
                      className="group relative w-full rounded-lg px-2 py-3 text-left text-sm font-medium transition-all duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      title="Expand sidebar"
                    >
                      <div className="flex items-center justify-center">
                        <div className="rounded-lg p-1.5 transition-all duration-200 bg-gray-50 group-hover:bg-gray-100">
                          <svg className="h-5 w-5 transition-colors text-gray-500 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </nav>
          </aside>

            <div className={`min-w-0 transition-all duration-300 ease-in-out ${
              ownerSidebarCollapsed ? 'md:ml-[60px]' : 'md:ml-[280px]'
            }`}>
              {/* Floating toggle button for desktop when sidebar is collapsed */}
              {ownerSidebarCollapsed && (
                <button
                  onClick={() => setOwnerSidebarCollapsed(false)}
                  className="hidden md:flex fixed left-[68px] top-24 z-40 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 p-2 shadow-lg transition-all duration-200 group"
                  title="Expand sidebar"
                >
                  <svg className="h-4 w-4 text-white group-hover:text-blue-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              <div className="flex items-center justify-end px-3 py-3 md:px-5">
                <button
                  type="button"
                  onClick={() => setOwnerSidebarOpen((v) => !v)}
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>

              {ownerSidebarOpen ? (
                <div className="border-b border-slate-200/60 bg-white/95 backdrop-blur-sm p-2 md:hidden shadow-lg">
                  <nav className="grid gap-2">
                    {ownerTabs.map((tab) => {
                      const Icon = tab.icon;
                      const getIconColor = (tabColor, isActive) => {
                        if (isActive) return 'text-white';
                        
                        switch(tabColor) {
                          case 'blue': return 'text-blue-600';
                          case 'emerald': return 'text-emerald-600';
                          case 'sky': return 'text-sky-600';
                          case 'amber': return 'text-amber-600';
                          case 'slate': return 'text-slate-600';
                          case 'purple': return 'text-purple-600';
                          case 'rose': return 'text-rose-600';
                          default: return 'text-slate-600';
                        }
                      };
                      
                      const getIconBg = (tabColor, isActive) => {
                        if (isActive) return 'bg-white/20';
                        
                        switch(tabColor) {
                          case 'blue': return 'bg-blue-100';
                          case 'emerald': return 'bg-emerald-100';
                          case 'sky': return 'bg-sky-100';
                          case 'amber': return 'bg-amber-100';
                          case 'slate': return 'bg-slate-100';
                          case 'purple': return 'bg-purple-100';
                          case 'rose': return 'bg-rose-100';
                          default: return 'bg-slate-100';
                        }
                      };

                      const getActiveGradient = (tabColor) => {
                        switch(tabColor) {
                          case 'blue': return 'from-blue-600 to-indigo-600 shadow-blue-500/25';
                          case 'emerald': return 'from-emerald-600 to-teal-600 shadow-emerald-500/25';
                          case 'sky': return 'from-sky-600 to-blue-600 shadow-sky-500/25';
                          case 'amber': return 'from-amber-600 to-orange-600 shadow-amber-500/25';
                          case 'slate': return 'from-slate-600 to-gray-600 shadow-slate-500/25';
                          case 'purple': return 'from-purple-600 to-indigo-600 shadow-purple-500/25';
                          case 'rose': return 'from-rose-600 to-pink-600 shadow-rose-500/25';
                          default: return 'from-blue-600 to-indigo-600 shadow-blue-500/25';
                        }
                      };
                      
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setOwnerTab(tab.id);
                            if (tab.id === 'messages') {
                              setMessagesTabClickCount(prev => prev + 1);
                            }
                            setOwnerSidebarOpen(false);
                          }}
                          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
                            ownerTab === tab.id 
                              ? `bg-gradient-to-r ${getActiveGradient(tab.color)} text-white shadow-lg` 
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className={`rounded-lg p-1.5 transition-all duration-200 ${getIconBg(tab.color, ownerTab === tab.id)}`}>
                            <Icon className={`h-5 w-5 transition-colors ${getIconColor(tab.color, ownerTab === tab.id)}`} />
                          </div>
                          <span className="font-medium">{tab.label}</span>
                          {tab.id === 'messages' && chatUnreadCount > 0 && (
                            <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg">
                              {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              ) : null}

              <div className="space-y-4 p-2 md:p-4">
                {ownerTab === 'overview' ? (
                  <div className="space-y-6">
                    {/* Overview Description */}
                    <div className={`rounded-2xl border p-6 shadow-sm ${ownerDarkMode ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-slate-800'}`}>
                      <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-xl bg-blue-600/10 p-2">
                          <LayoutDashboard className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">{t('Owner Overview')}</h2>
                          <p className={`text-sm ${ownerDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {t('Monitor your rental portfolio performance at a glance')}
                          </p>
                        </div>
                      </div>
                      <p className={`text-sm leading-6 ${ownerDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {t('Track your property listings, monitor approval status, and analyze viewer engagement. This dashboard provides real-time insights into your rental business performance, helping you make informed decisions about property management and marketing strategies.')}
                      </p>
                    </div>

                    {/* Stats Cards and Pie Chart */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      {/* Stats Cards */}
                      <div className="lg:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className={`group relative overflow-hidden rounded-2xl border p-6 shadow-lg transition-all duration-300 hover:shadow-xl ${
                          ownerDarkMode 
                            ? 'border-blue-800/30 bg-gradient-to-br from-blue-900/50 to-blue-800/30 hover:border-blue-700/40' 
                            : 'border-blue-200/60 bg-gradient-to-br from-blue-50 to-blue-100 hover:border-blue-300/80'
                        }`}>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <div className={`rounded-xl p-2 ${
                                ownerDarkMode ? 'bg-blue-500/20' : 'bg-blue-600/10'
                              }`}>
                                <Building className={`h-5 w-5 ${
                                  ownerDarkMode ? 'text-blue-400' : 'text-blue-600'
                                }`} />
                              </div>
                              <div className={`text-xs font-semibold uppercase tracking-wider ${
                                ownerDarkMode ? 'text-blue-400' : 'text-blue-700'
                              }`}>{t('Total')}</div>
                            </div>
                            <p className={`text-3xl font-bold mb-1 ${
                              ownerDarkMode ? 'text-slate-100' : 'text-slate-900'
                            }`}>{ownerStats.total}</p>
                            <p className={`text-sm font-medium ${
                              ownerDarkMode ? 'text-blue-400' : 'text-blue-700'
                            }`}>{t('Properties Listed')}</p>
                          </div>
                          <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl ${
                            ownerDarkMode ? 'bg-blue-600/10' : 'bg-blue-200/20'
                          }`}></div>
                        </div>

                        <div className={`group relative overflow-hidden rounded-2xl border p-6 shadow-lg transition-all duration-300 hover:shadow-xl ${
                          ownerDarkMode 
                            ? 'border-emerald-800/30 bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 hover:border-emerald-700/40' 
                            : 'border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:border-emerald-300/80'
                        }`}>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <div className={`rounded-xl p-2 ${
                                ownerDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-600/10'
                              }`}>
                                <CheckCircle className={`h-5 w-5 ${
                                  ownerDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                                }`} />
                              </div>
                              <div className={`text-xs font-semibold uppercase tracking-wider ${
                                ownerDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                              }`}>{t('Live')}</div>
                            </div>
                            <p className={`text-3xl font-bold mb-1 ${
                              ownerDarkMode ? 'text-slate-100' : 'text-slate-900'
                            }`}>{ownerStats.active}</p>
                            <p className={`text-sm font-medium ${
                              ownerDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                            }`}>{t('Active Listings')}</p>
                          </div>
                          <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl ${
                            ownerDarkMode ? 'bg-emerald-600/10' : 'bg-emerald-200/20'
                          }`}></div>
                        </div>

                        <div className={`group relative overflow-hidden rounded-2xl border p-6 shadow-lg transition-all duration-300 hover:shadow-xl ${
                          ownerDarkMode 
                            ? 'border-amber-800/30 bg-gradient-to-br from-amber-900/50 to-amber-800/30 hover:border-amber-700/40' 
                            : 'border-amber-200/60 bg-gradient-to-br from-amber-50 to-amber-100 hover:border-amber-300/80'
                        }`}>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <div className={`rounded-xl p-2 ${
                                ownerDarkMode ? 'bg-amber-500/20' : 'bg-amber-600/10'
                              }`}>
                                <Clock className={`h-5 w-5 ${
                                  ownerDarkMode ? 'text-amber-400' : 'text-amber-600'
                                }`} />
                              </div>
                              <div className={`text-xs font-semibold uppercase tracking-wider ${
                                ownerDarkMode ? 'text-amber-400' : 'text-amber-700'
                              }`}>{t('Review')}</div>
                            </div>
                            <p className={`text-3xl font-bold mb-1 ${
                              ownerDarkMode ? 'text-slate-100' : 'text-slate-900'
                            }`}>{ownerStats.pending}</p>
                            <p className={`text-sm font-medium ${
                              ownerDarkMode ? 'text-amber-400' : 'text-amber-700'
                            }`}>{t('Pending Approval')}</p>
                          </div>
                          <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl ${
                            ownerDarkMode ? 'bg-amber-600/10' : 'bg-amber-200/20'
                          }`}></div>
                        </div>

                        <div className={`group relative overflow-hidden rounded-2xl border p-6 shadow-lg transition-all duration-300 hover:shadow-xl ${
                          ownerDarkMode 
                            ? 'border-purple-800/30 bg-gradient-to-br from-purple-900/50 to-purple-800/30 hover:border-purple-700/40' 
                            : 'border-purple-200/60 bg-gradient-to-br from-purple-50 to-purple-100 hover:border-purple-300/80'
                        }`}>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <div className={`rounded-xl p-2 ${
                                ownerDarkMode ? 'bg-purple-500/20' : 'bg-purple-600/10'
                              }`}>
                                <Eye className={`h-5 w-5 ${
                                  ownerDarkMode ? 'text-purple-400' : 'text-purple-600'
                                }`} />
                              </div>
                              <div className={`text-xs font-semibold uppercase tracking-wider ${
                                ownerDarkMode ? 'text-purple-400' : 'text-purple-700'
                              }`}>{t('Views')}</div>
                            </div>
                            <p className={`text-3xl font-bold mb-1 ${
                              ownerDarkMode ? 'text-slate-100' : 'text-slate-900'
                            }`}>{ownerStats.totalViews.toLocaleString()}</p>
                            <p className={`text-sm font-medium ${
                              ownerDarkMode ? 'text-purple-400' : 'text-purple-700'
                            }`}>{t('Total Views')}</p>
                          </div>
                          <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl ${
                            ownerDarkMode ? 'bg-purple-600/10' : 'bg-purple-200/20'
                          }`}></div>
                        </div>
                      </div>

                      {/* Pie Chart */}
                      <div className={`rounded-2xl border p-6 shadow-lg ${ownerDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                        <h3 className={`text-lg font-bold mb-4 ${ownerDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{t('Property Distribution')}</h3>
                        <div className="relative">
                          <svg viewBox="0 0 200 200" className="w-full h-auto max-w-[200px] mx-auto">
                            {/* Pie Chart */}
                            <g transform="translate(100, 100)">
                              {/* Background circle */}
                              <circle cx="0" cy="0" r="80" fill="none" stroke={ownerDarkMode ? '#334155' : '#e2e8f0'} strokeWidth="2" />
                              
                              {ownerStats.total > 0 ? (
                                <>
                                  {/* Active Listings - Green */}
                                  {ownerStats.active > 0 && (() => {
                                    const percentage = (ownerStats.active / ownerStats.total) * 100;
                                    const angle = (percentage / 100) * 360;
                                    const endAngle = angle - 90;
                                    const midAngle = (-90 + endAngle) / 2;
                                    const x1 = 80 * Math.cos((-90) * Math.PI / 180);
                                    const y1 = 80 * Math.sin((-90) * Math.PI / 180);
                                    const x2 = 80 * Math.cos(endAngle * Math.PI / 180);
                                    const y2 = 80 * Math.sin(endAngle * Math.PI / 180);
                                    const largeArc = angle > 180 ? 1 : 0;
                                    
                                    // Position label at the edge (70% of radius)
                                    const labelRadius = 56;
                                    const labelX = labelRadius * Math.cos(midAngle * Math.PI / 180);
                                    const labelY = labelRadius * Math.sin(midAngle * Math.PI / 180);
                                    
                                    return (
                                      <g className="transition-all duration-500 hover:opacity-80">
                                        <path
                                          d={`M 0 0 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                          fill="#10b981"
                                          className="filter drop-shadow-sm"
                                        />
                                        <text
                                          x={labelX}
                                          y={labelY}
                                          fill="white"
                                          fontSize="12"
                                          fontWeight="bold"
                                          textAnchor="middle"
                                          dominantBaseline="middle"
                                        >
                                          {Math.round(percentage)}%
                                        </text>
                                      </g>
                                    );
                                  })()}
                                  
                                  {/* Pending Approval - Amber */}
                                  {ownerStats.pending > 0 && (() => {
                                    const activePercentage = (ownerStats.active / ownerStats.total) * 100;
                                    const pendingPercentage = (ownerStats.pending / ownerStats.total) * 100;
                                    const startAngle = (activePercentage / 100) * 360 - 90;
                                    const angle = (pendingPercentage / 100) * 360;
                                    const endAngle = startAngle + angle;
                                    const midAngle = (startAngle + endAngle) / 2;
                                    const x1 = 80 * Math.cos(startAngle * Math.PI / 180);
                                    const y1 = 80 * Math.sin(startAngle * Math.PI / 180);
                                    const x2 = 80 * Math.cos(endAngle * Math.PI / 180);
                                    const y2 = 80 * Math.sin(endAngle * Math.PI / 180);
                                    const largeArc = angle > 180 ? 1 : 0;
                                    
                                    // Position label at the edge (70% of radius)
                                    const labelRadius = 56;
                                    const labelX = labelRadius * Math.cos(midAngle * Math.PI / 180);
                                    const labelY = labelRadius * Math.sin(midAngle * Math.PI / 180);
                                    
                                    return (
                                      <g className="transition-all duration-500 hover:opacity-80">
                                        <path
                                          d={`M 0 0 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                          fill="#f59e0b"
                                          className="filter drop-shadow-sm"
                                        />
                                        <text
                                          x={labelX}
                                          y={labelY}
                                          fill="white"
                                          fontSize="12"
                                          fontWeight="bold"
                                          textAnchor="middle"
                                          dominantBaseline="middle"
                                        >
                                          {Math.round(pendingPercentage)}%
                                        </text>
                                      </g>
                                    );
                                  })()}
                                  
                                  {/* Other Properties - Blue */}
                                  {(() => {
                                    const activePercentage = (ownerStats.active / ownerStats.total) * 100;
                                    const pendingPercentage = (ownerStats.pending / ownerStats.total) * 100;
                                    const otherPercentage = 100 - activePercentage - pendingPercentage;
                                    if (otherPercentage <= 0) return null;
                                    
                                    const startAngle = ((activePercentage + pendingPercentage) / 100) * 360 - 90;
                                    const angle = (otherPercentage / 100) * 360;
                                    const endAngle = startAngle + angle;
                                    const midAngle = (startAngle + endAngle) / 2;
                                    const x1 = 80 * Math.cos(startAngle * Math.PI / 180);
                                    const y1 = 80 * Math.sin(startAngle * Math.PI / 180);
                                    const x2 = 80 * Math.cos(endAngle * Math.PI / 180);
                                    const y2 = 80 * Math.sin(endAngle * Math.PI / 180);
                                    const largeArc = angle > 180 ? 1 : 0;
                                    
                                    // Position label at the edge (70% of radius)
                                    const labelRadius = 56;
                                    const labelX = labelRadius * Math.cos(midAngle * Math.PI / 180);
                                    const labelY = labelRadius * Math.sin(midAngle * Math.PI / 180);
                                    
                                    return (
                                      <g className="transition-all duration-500 hover:opacity-80">
                                        <path
                                          d={`M 0 0 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                          fill="#3b82f6"
                                          className="filter drop-shadow-sm"
                                        />
                                        <text
                                          x={labelX}
                                          y={labelY}
                                          fill="white"
                                          fontSize="12"
                                          fontWeight="bold"
                                          textAnchor="middle"
                                          dominantBaseline="middle"
                                        >
                                          {Math.round(otherPercentage)}%
                                        </text>
                                      </g>
                                    );
                                  })()}
                                </>
                              ) : (
                                <text
                                  x="0"
                                  y="0"
                                  fill={ownerDarkMode ? '#94a3b8' : '#64748b'}
                                  fontSize="14"
                                  fontWeight="500"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  {t('No data')}
                                </text>
                              )}
                            </g>
                          </svg>
                          
                          {/* Legend */}
                          <div className="mt-6 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className={`text-sm ${ownerDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t('Active')}</span>
                              </div>
                              <span className={`text-sm font-semibold ${ownerDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{ownerStats.active}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <span className={`text-sm ${ownerDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t('Pending')}</span>
                              </div>
                              <span className={`text-sm font-semibold ${ownerDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{ownerStats.pending}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className={`text-sm ${ownerDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{t('Other')}</span>
                              </div>
                              <span className={`text-sm font-semibold ${ownerDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{ownerStats.total - ownerStats.active - ownerStats.pending}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {ownerTab === 'new_listing' ? (
                  <div className={`rounded-xl border p-4 ${
                    ownerDarkMode 
                      ? 'border-slate-700 bg-slate-800' 
                      : 'border-slate-200 bg-slate-50'
                  }`}>
                    <h4 className={`mb-1 text-lg font-bold ${
                      ownerDarkMode ? 'text-slate-100' : 'text-slate-900'
                    }`}>{t('Post a New Listing')}</h4>
                    <p className={`mb-4 text-sm ${
                      ownerDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}>{t('Submit your property and complete listing fee payment.')}</p>
                    <PropertyForm onPosted={(propertyId) => void propertyId} />
                  </div>
                ) : null}

                {ownerTab === 'messages' ? null : null}

                {ownerTab === 'my_properties' ? (
                  <div className="space-y-4">
                    {ownerActionError ? (
                      <div className={`rounded-lg border p-3 text-sm ${
                        ownerDarkMode 
                          ? 'border-red-800/30 bg-red-900/20 text-red-400' 
                          : 'border-red-200 bg-red-50 text-red-700'
                      }`}>
                        {ownerActionError}
                      </div>
                    ) : null}
                    {myProperties.length === 0 ? (
                      <div className={`rounded-xl border border-dashed p-8 text-center ${
                        ownerDarkMode 
                          ? 'border-slate-600 bg-slate-800/50 text-slate-400' 
                          : 'border-slate-300 bg-slate-50 text-slate-500'
                      }`}>
                        {t('No listings yet.')}
                      </div>
                    ) : (
                      myProperties.map((p) => (
                        <div key={p.id} className={`rounded-xl border p-4 shadow-sm ${
                          ownerDarkMode 
                            ? 'border-slate-700 bg-slate-800' 
                            : 'border-slate-200 bg-white'
                        }`}>
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <div className={`h-24 w-full shrink-0 overflow-hidden rounded-xl sm:w-32 ${
                              ownerDarkMode ? 'bg-slate-700' : 'bg-slate-100'
                            }`}>
                              <Cover src={p.cover_photo} alt={p.real_address} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h5 className={`font-semibold ${
                                  ownerDarkMode ? 'text-slate-100' : 'text-slate-900'
                                }`}>{p.city} - {p.subcity}</h5>
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  p.status === 'active' ? (ownerDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800') :
                                  p.status === 'pending' ? (ownerDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800') :
                                  p.status === 'rented' ? (ownerDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800') :
                                  (ownerDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800')
                                }`}>
                                  {p.status}
                                </span>
                              </div>
                              <p className={`mt-1 line-clamp-2 text-sm ${
                                ownerDarkMode ? 'text-slate-400' : 'text-slate-600'
                              }`}>{p.real_address}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                                <span className={`font-semibold ${
                                  ownerDarkMode ? 'text-slate-100' : 'text-slate-900'
                                }`}>{Number(p.price).toLocaleString()} ETB</span>
                                <span className={ownerDarkMode ? 'text-slate-500' : 'text-slate-500'}>{(p.views_count || 0).toLocaleString()} {t('views')}</span>
                              </div>
                              <div className="mt-3">
                                {p.status === 'active' ? (
                                  <button
                                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
                                    onClick={() => markRented(p.id)}
                                  >
                                    {t('Mark as Rented')}
                                  </button>
                                ) : null}
                                {(p.status === 'rented' || p.status === 'rejected') ? (
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                      onClick={() => deleteProperty(p.id)}
                                      disabled={deleteLoadingId === p.id}
                                    >
                                      {deleteLoadingId === p.id ? t('Deleting...') : t('Delete')}
                                    </button>
                                    <button
                                      type="button"
                                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                      onClick={() => startRepost(p.id)}
                                      disabled={repostLoadingId === p.id}
                                    >
                                      {repostLoadingId === p.id ? t('Loading...') : t('Repost')}
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          {editingRepostProperty?.id === p.id ? (
                            <div className={`mt-4 rounded-xl border p-3 ${
                              ownerDarkMode 
                                ? 'border-indigo-700/30 bg-indigo-900/20' 
                                : 'border-indigo-200 bg-indigo-50/40'
                            }`}>
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <h6 className={`text-sm font-semibold ${
                                  ownerDarkMode ? 'text-slate-100' : 'text-slate-900'
                                }`}>
                                  {p.status === 'rented' ? t('Repost (payment required)') : t('Repost (no extra payment)')}
                                </h6>
                                <button
                                  type="button"
                                  className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                                    ownerDarkMode 
                                      ? 'border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700' 
                                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                  }`}
                                  onClick={() => setEditingRepostProperty(null)}
                                >
                                  {t('Cancel')}
                                </button>
                              </div>
                              <PropertyForm
                                mode="repost"
                                propertyId={editingRepostProperty.id}
                                initialValues={editingRepostProperty}
                                requiresPayment={p.status === 'rented'}
                                submitLabel={p.status === 'rented' ? t('Update, Repost & Pay') : t('Update & Submit for Approval')}
                                onPosted={() => {
                                  setEditingRepostProperty(null);
                                  refreshMyProperties();
                                }}
                              />
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                ) : null}

                {ownerTab === 'support' ? (
                  <div className={`rounded-xl border p-5 ${ownerDarkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-gradient-to-br from-purple-50 to-pink-50'}`}>
                    <h4 className={`text-lg font-bold ${ownerDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{t('Help & Support')}</h4>
                    <p className={`mt-1 text-sm ${ownerDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {t('Having issues with listings or payments? Send feedback or a complaint.')}
                    </p>
                    <button
                      onClick={() => setShowComplaintForm(true)}
                      className={`mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                        ownerDarkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gradient-to-r from-purple-600 to-pink-600'
                      }`}
                    >
                      {t('Get Support')}
                    </button>
                  </div>
                ) : null}

                {ownerTab === 'settings' ? (
                  <div className="space-y-4">
                    <div className={`rounded-xl border p-4 ${ownerDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h2 className={`text-xl font-bold ${ownerDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{t('Settings')}</h2>
                          <p className={`mt-1 text-sm ${ownerDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                            {t('Manage your owner account, security, and dashboard appearance.')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOwnerDarkMode((v) => !v)}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                            ownerDarkMode
                              ? 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {ownerDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                          {ownerDarkMode ? t('Light Mode') : t('Dark Mode')}
                        </button>
                      </div>
                    </div>

                    <form onSubmit={submitOwnerSettings} className={`rounded-xl border p-4 ${ownerDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                      <h3 className={`mb-4 text-lg font-semibold ${ownerDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{t('Owner Account Settings')}</h3>
                      <div className="grid gap-4">
                        <div>
                          <label className={`mb-1 block text-sm font-medium ${ownerDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{t('Full Name')}</label>
                          <input
                            value={ownerSettingsName}
                            onChange={(e) => setOwnerSettingsName(e.target.value)}
                            className={`w-full rounded-lg border px-3 py-2 text-sm ${
                              ownerDarkMode
                                ? 'border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-400'
                                : 'border-gray-300 bg-white text-slate-900'
                            }`}
                            placeholder={t('Your full name')}
                          />
                        </div>

                        <div className="rounded-lg border border-dashed border-indigo-300/60 p-3">
                          <p className={`mb-3 flex items-center gap-2 text-sm font-semibold ${ownerDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            <ShieldCheck className="h-4 w-4 text-indigo-500" />
                            {t('Change Password')}
                          </p>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <input
                              type="password"
                              value={ownerSettingsCurrentPassword}
                              onChange={(e) => setOwnerSettingsCurrentPassword(e.target.value)}
                              className={`rounded-lg border px-3 py-2 text-sm ${
                                ownerDarkMode
                                  ? 'border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-400'
                                  : 'border-gray-300 bg-white text-slate-900'
                              }`}
                              placeholder={t('Current password')}
                            />
                            <input
                              type="password"
                              value={ownerSettingsNewPassword}
                              onChange={(e) => setOwnerSettingsNewPassword(e.target.value)}
                              className={`rounded-lg border px-3 py-2 text-sm ${
                                ownerDarkMode
                                  ? 'border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-400'
                                  : 'border-gray-300 bg-white text-slate-900'
                              }`}
                              placeholder={t('New password')}
                            />
                            <input
                              type="password"
                              value={ownerSettingsConfirmPassword}
                              onChange={(e) => setOwnerSettingsConfirmPassword(e.target.value)}
                              className={`rounded-lg border px-3 py-2 text-sm ${
                                ownerDarkMode
                                  ? 'border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-400'
                                  : 'border-gray-300 bg-white text-slate-900'
                              }`}
                              placeholder={t('Confirm new password')}
                            />
                          </div>
                        </div>

                        {ownerSettingsError ? (
                          <div className={`rounded-lg border px-3 py-2 text-sm ${
                            ownerDarkMode 
                              ? 'border-red-800/30 bg-red-900/20 text-red-400' 
                              : 'border-red-200 bg-red-50 text-red-700'
                          }`}>{ownerSettingsError}</div>
                        ) : null}
                        {ownerSettingsSuccess ? (
                          <div className={`rounded-lg border px-3 py-2 text-sm ${
                            ownerDarkMode 
                              ? 'border-green-800/30 bg-green-900/20 text-green-400' 
                              : 'border-green-200 bg-green-50 text-green-700'
                          }`}>{ownerSettingsSuccess}</div>
                        ) : null}

                        <button
                          type="submit"
                          disabled={ownerSettingsLoading}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          <Save className="h-4 w-4" />
                          {ownerSettingsLoading ? t('Saving...') : t('Save Settings')}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : null}

                {ownerTab === 'guide' ? (
                  <div className={`rounded-2xl border p-6 shadow-sm ${ownerDarkMode ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-slate-800'}`}>
                    <div className="mb-5 flex items-center gap-3">
                      <div className="rounded-xl bg-blue-600/10 p-2">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{t('Owner Guide')}</h2>
                        <p className={`text-sm ${ownerDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          {t('Comprehensive tools for managing listings, payments, and renter relationships.')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6 text-sm leading-relaxed">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-blue-600">{t('Welcome to Your Owner Dashboard')}</h3>
                        <p>
                          {t('This professional workspace empowers you to efficiently manage your rental portfolio. From listing properties and tracking performance to communicating with potential renters, our platform provides all the essential tools you need to succeed in the rental market.')}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-500">{t('📊 Overview')}</h4>
                        <p>
                          {t('Monitor your portfolio\'s performance at a glance with comprehensive metrics including total listings, active properties, pending approvals, and cumulative view counts. These insights help you assess market interest and optimize your listing strategy for maximum visibility and occupancy.')}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-500">{t('➕ Post a New Listing')}</h4>
                        <p>
                          {t('Create compelling property listings with detailed descriptions, high-quality photographs, and accurate pricing. After submission, complete the secure payment process to activate admin review. Once approved, your listing becomes visible to our network of qualified renters.')}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-500">{t('🏠 My Properties')}</h4>
                        <p>
                          {t('Manage your entire property portfolio from this centralized hub. Update listing status as properties become rented, remove eligible listings, or repost previously rented/rejected properties with refreshed information to maintain an active and appealing presence.')}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-500">{t('💬 Messages')}</h4>
                        <p>
                          {t('Build trust and accelerate rental decisions through prompt, professional communication with prospective renters. Our real-time messaging system enables you to address inquiries quickly, provide additional information, and establish positive relationships that can convert interest into signed agreements.')}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-500">{t('⚙️ Settings')}</h4>
                        <p>
                          {t('Maintain your professional profile by updating contact information, strengthening account security with password changes, and customizing your interface with dark mode preferences for comfortable extended use during any time of day.')}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-blue-500">{t('🆘 Help & Support')}</h4>
                        <p>
                          {t('Receive expert assistance for listing management, payment processing, approval procedures, or technical challenges. Our dedicated support team is committed to helping you resolve issues quickly and maximize your platform success.')}
                        </p>
                      </div>

                      <div className={`mt-6 p-4 rounded-xl border ${
                        ownerDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <h4 className={`font-semibold mb-2 ${
                          ownerDarkMode ? 'text-blue-400' : 'text-blue-700'
                        }`}>{t('💡 Best Practices for Success')}</h4>
                        <p className={`${ownerDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                          {t('Optimize your rental performance by:')}<br/>
                          {t('1) Maintaining accurate, detailed listing information')}<br/>
                          {t('2) Uploading high-quality, recent photographs')}<br/>
                          {t('3) Responding promptly to renter inquiries')}<br/>
                          {t('4) Regularly reviewing performance metrics to refine your strategy and improve occupancy rates.')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
        </div>
      ) : null}

      {chatState ? (
        <div className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm p-3">
          <div className={`mx-auto mt-20 max-w-4xl rounded-2xl shadow-2xl border ${chatDarkMode ? 'bg-slate-900 border-slate-700/80' : 'bg-white border-slate-200/60'}`}>
            <ChatComponent
              withUserId={chatState.withUserId}
              propertyId={chatState.propertyId}
              onClose={() => setChatState(null)}
              isDarkMode={chatDarkMode}
            />
          </div>
        </div>
      ) : null}

      {showChatInbox ? (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm p-3">
          <div className={`mx-auto mt-20 max-w-6xl overflow-hidden rounded-2xl shadow-2xl border ${chatDarkMode ? 'bg-slate-900 border-slate-700/80' : 'bg-white border-slate-200/60'}`}>
            <ChatInbox
              onClose={() => {
                setShowChatInbox(false);
              }}
              isDarkMode={chatDarkMode}
            />
          </div>
        </div>
      ) : null}

      {showComplaintForm ? (
        <ComplaintForm
          onClose={() => setShowComplaintForm(false)}
          onSuccess={() => {
            setShowComplaintForm(false);
            // Optionally refresh data or show success message
          }}
          darkMode={darkMode}
        />
      ) : null}
    </div>
  );
}


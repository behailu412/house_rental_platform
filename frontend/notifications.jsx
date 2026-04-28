import React, { useEffect, useMemo, useState, useRef } from 'react';
import { getApiBase } from './api.js';
import NotificationPreferences from './notification_preferences.jsx';

// Add custom CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
  
  @keyframes ping {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    75%, 100% {
      transform: scale(2);
      opacity: 0;
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.4s ease-out;
  }
  
  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }
  
  .animate-ping {
    animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;
if (!document.head.querySelector('style[data-notifications]')) {
  style.setAttribute('data-notifications', 'true');
  document.head.appendChild(style);
}

function NotificationIcon({ type, isRead }) {
  const iconConfigs = {
    new_property: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      gradient: 'from-blue-500 to-blue-600'
    },
    new_message: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      gradient: 'from-emerald-500 to-emerald-600'
    },
    property_approved: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-green-500 to-green-600'
    },
    property_rejected: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-red-500 to-red-600'
    },
    payment_received: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: 'from-violet-500 to-violet-600'
    },
    new_complaint: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      gradient: 'from-amber-500 to-amber-600'
    },
    complaint_update: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      gradient: 'from-indigo-500 to-indigo-600'
    }
  };
  
  const config = iconConfigs[type] || iconConfigs.new_property;
  
  return (
    <div className={`relative w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white shadow-sm ${
      !isRead ? 'ring-2 ring-white ring-opacity-60 ring-offset-1 ring-offset-blue-100' : 'opacity-80'
    }`}>
      {config.icon}
      {!isRead && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
      )}
    </div>
  );
}

function NotificationItem({ notification, onRead, onDelete, onPropertyClick }) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const iconConfigs = {
    new_property: {
      bgLight: 'bg-blue-50',
      borderLight: 'border-blue-200',
      textLight: 'text-blue-700',
      accentColor: 'bg-blue-500'
    },
    new_message: {
      bgLight: 'bg-emerald-50',
      borderLight: 'border-emerald-200',
      textLight: 'text-emerald-700',
      accentColor: 'bg-emerald-500'
    },
    property_approved: {
      bgLight: 'bg-green-50',
      borderLight: 'border-green-200',
      textLight: 'text-green-700',
      accentColor: 'bg-green-500'
    },
    property_rejected: {
      bgLight: 'bg-red-50',
      borderLight: 'border-red-200',
      textLight: 'text-red-700',
      accentColor: 'bg-red-500'
    },
    payment_received: {
      bgLight: 'bg-violet-50',
      borderLight: 'border-violet-200',
      textLight: 'text-violet-700',
      accentColor: 'bg-violet-500'
    },
    new_complaint: {
      bgLight: 'bg-amber-50',
      borderLight: 'border-amber-200',
      textLight: 'text-amber-700',
      accentColor: 'bg-amber-500'
    },
    complaint_update: {
      bgLight: 'bg-indigo-50',
      borderLight: 'border-indigo-200',
      textLight: 'text-indigo-700',
      accentColor: 'bg-indigo-500'
    }
  };
  
  const config = iconConfigs[notification.type] || iconConfigs.new_property;
  
  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
    
    if (notification.related_type === 'property' && notification.related_id) {
      onPropertyClick(notification.related_id);
    }
  };
  
  const handleDelete = async (e) => {
    e.stopPropagation();
    setIsDeleting(true);
    await onDelete(notification.id);
  };
  
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatExactTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Remove repetitive text from message
  const cleanMessage = notification.message.replace(/^You have received a new message:\s*/i, '');
  
  return (
    <div 
      className={`group rounded-xl p-3 cursor-pointer transition-all duration-200 ${
        notification.is_read 
          ? 'bg-white border border-gray-200 hover:bg-gray-50' 
          : `${config.bgLight} border ${config.borderLight} hover:bg-opacity-80`
      } ${
        isDeleting ? 'opacity-50 scale-95' : 'opacity-100'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <NotificationIcon type={notification.type} isRead={notification.is_read} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-semibold text-sm leading-tight truncate ${
              notification.is_read ? 'text-gray-900' : config.textLight
            }`}>
              {notification.title}
            </h3>
            {!notification.is_read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
            )}
          </div>
          
          <p className={`text-xs leading-relaxed mb-2 line-clamp-2 ${
            notification.is_read ? 'text-gray-600' : config.textLight
          }`}>
            {cleanMessage}
          </p>
          
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-xs text-gray-500">
                {formatTimeAgo(notification.created_at)}
              </span>
              <span className="block truncate text-[11px] text-gray-400">
                {formatExactTime(notification.created_at)}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {!notification.is_read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRead(notification.id);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors duration-200"
                >
                  Read
                </button>
              )}
              <button
                onClick={handleDelete}
                className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Notifications({ onPropertyClick }) {
  const apiBase = useMemo(() => getApiBase(), []);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build URL with proper parameter handling
      const params = new URLSearchParams({
        action: 'list',
        unread_only: showUnreadOnly ? '1' : '0'
      });
      
      const url = `${apiBase}/notifications.php?${params.toString()}`;
      const res = await fetch(url, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setNotifications(data.items || []);
        setUnreadCount(data.unread_count || 0);
      } else {
        setError(data.error || 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Notifications fetch error:', error);
      setError(error.message || 'Network error while loading notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [apiBase, showUnreadOnly, isOpen]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Only fetch unread count for polling to be efficient
      fetch(`${apiBase}/notifications.php?action=list&limit=1`, {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            setUnreadCount(data.unread_count || 0);
          }
        })
        .catch(() => {}); // Ignore polling errors
    }, 30000);

    // Listen for complaint notification updates
    const handleComplaintNotificationsRead = async (event) => {
      const { type } = event.detail;
      if (type === 'new_complaint') {
        await markNotificationsByType(type);
      }
    };

    window.addEventListener('complaintNotificationsRead', handleComplaintNotificationsRead);

    return () => {
      clearInterval(interval);
      window.removeEventListener('complaintNotificationsRead', handleComplaintNotificationsRead);
    };
  }, [apiBase]);

  const markAsRead = async (notificationId) => {
    try {
      const res = await fetch(`${apiBase}/notifications.php?action=mark_read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notification_id: notificationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setError(data.error || 'Failed to mark as read');
      }
    } catch {
      setError('Network error while updating notification.');
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${apiBase}/notifications.php?action=mark_read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mark_all: 1 }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: 1 }))
        );
        setUnreadCount(0);
      } else {
        setError(data.error || 'Failed to mark all as read');
      }
    } catch {
      setError('Network error while updating notifications.');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const res = await fetch(`${apiBase}/notifications.php?action=delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notification_id: notificationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        const deleted = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (deleted && !deleted.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else {
        setError(data.error || 'Failed to delete notification');
      }
    } catch {
      setError('Network error while deleting notification.');
    }
  };

  // Mark notifications of a specific type as read
  const markNotificationsByType = async (type) => {
    try {
      const res = await fetch(`${apiBase}/notifications.php?action=mark_read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        // Update local state to reflect the change
        setNotifications(prev => 
          prev.map(n => n.type === type ? { ...n, is_read: 1 } : n)
        );
        
        // Recalculate unread count
        const newUnreadCount = notifications.filter(n => n.type !== type && !n.is_read).length;
        setUnreadCount(newUnreadCount);
        
        return data.marked_count || 0;
      }
    } catch {
      // Silently fail - count will update on next poll
    }
    return 0;
  };

  if (!isOpen) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-3 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl transition-all duration-200 hover:bg-gray-50 group"
        >
          <svg className="w-6 h-6 transform transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          )}
        </button>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
    );
  }

  // Return the main notifications modal
  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-black/60 backdrop-blur-sm p-2 animate-fadeIn">
      <div 
        ref={modalRef} 
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[40vh] overflow-hidden transform transition-all duration-300 animate-slideUp border border-gray-200"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-blue-100 text-xs font-medium">
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all duration-200"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUnreadOnly(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  !showUnreadOnly 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setShowUnreadOnly(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  showUnreadOnly 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Unread
              </button>
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-all duration-200"
              >
                Mark all as read
              </button>
            </div>
            <button
              onClick={() => setShowPreferences(true)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-all duration-200"
              title="Preferences"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto max-h-[40vh] scrollbar-thin">
          <div className="p-4">
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
                <p className="mt-3 text-gray-600 text-sm">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {showUnreadOnly ? 'All caught up!' : 'No notifications'}
                </h3>
                <p className="text-gray-600 text-center text-xs max-w-xs">
                  {showUnreadOnly 
                    ? 'You have no unread notifications.'
                    : 'Notifications will appear here when there are updates.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div key={notification.id} className="animate-fadeIn">
                    <NotificationItem
                      notification={notification}
                      onRead={markAsRead}
                      onDelete={deleteNotification}
                      onPropertyClick={onPropertyClick}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Preferences Modal Overlay */}
      {showPreferences && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-[60] bg-black/60 backdrop-blur-sm p-2 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[70vh] overflow-hidden transform transition-all duration-300 animate-slideUp border border-gray-200">
            <NotificationPreferences onClose={() => setShowPreferences(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

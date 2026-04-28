import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getApiBase } from './api.js';
import { readStoredUser } from './authStorage.js';
import { X } from 'lucide-react';

export default function ChatComponent({
  withUserId,
  propertyId,
  onClose,
  peerName = 'Private chat',
  propertyLabel = '',
  onConversationUpdated,
  showHeader = true, // Add prop to control header visibility
  isDarkMode = false,
}) {
  const apiBase = useMemo(() => getApiBase(), []);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const currentUser = useMemo(() => readStoredUser(), []);

  const currentUserId = currentUser?.id;

  const listEndRef = useRef(null);

  const fetchMessages = async () => {
    if (!currentUserId || !withUserId) return;
    try {
      const res = await fetch(`${apiBase}/chat.php?action=fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ with_user_id: withUserId, property_id: propertyId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch {
      // ignore polling errors
    }
  };

  useEffect(() => {
    fetchMessages();
    const t = setInterval(fetchMessages, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withUserId, propertyId, currentUserId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    setError('');
    if (!text.trim()) return;
    if (!currentUserId) {
      setError('Login required.');
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${apiBase}/chat.php?action=send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          to_user_id: withUserId,
          property_id: propertyId,
          message: text.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok !== true) {
        setError(data.error || 'Failed to send message');
        return;
      }
      setText('');
      // Fetch immediately after sending.
      await fetchMessages();
      if (typeof onConversationUpdated === 'function') {
        onConversationUpdated();
      }
    } catch {
      setError('Network error while sending.');
    } finally {
      setSending(false);
    }
  };

  const sendDisabled = !text.trim() || sending;

  return (
    <div className={`flex h-[70vh] flex-col ${isDarkMode ? 'bg-slate-900 text-slate-100' : ''}`}>
      {/* Chat Header - Only show if showHeader is true */}
      {showHeader && (
        <div className={`flex items-center justify-between border-b px-4 py-3 ${
          isDarkMode 
            ? 'border-slate-700 bg-slate-900' 
            : 'border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50'
        }`}>
          <div>
            <h3 className={`font-semibold ${
              isDarkMode ? 'text-slate-100' : 'text-gray-800'
            }`}>{peerName}</h3>
            {propertyLabel && <p className={`text-sm ${
              isDarkMode ? 'text-slate-300' : 'text-gray-600'
            }`}>{propertyLabel}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg p-2 transition-all duration-200 ${
              isDarkMode 
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/60 shadow-sm hover:shadow-md'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      <div className={`flex-1 overflow-auto p-3 ${isDarkMode ? 'bg-slate-900' : ''}`}>
        {messages.length === 0 ? (
          <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>No messages yet.</div>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => {
              const isMine = (m.from_user_id ?? null) === currentUserId;
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                    isMine 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                      : isDarkMode 
                        ? 'bg-slate-800 text-slate-100 border border-slate-700' 
                        : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border border-gray-200 shadow-sm'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm">{m.message}</div>
                    <div className={`mt-1 text-[11px] flex items-center gap-1 ${
                      isMine 
                        ? 'text-blue-100' 
                        : isDarkMode 
                          ? 'text-gray-400' 
                          : 'text-gray-500'
                    }`}>
                      {isMine ? (
                        <>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {m.seen === 1 ? (
                            <span className="flex items-center" title="Read">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" transform="translate(2, 2)"/>
                              </svg>
                              <svg className="w-3 h-3 -ml-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" transform="translate(2, 2)"/>
                              </svg>
                            </span>
                          ) : (
                            <span className="flex items-center" title="Sent">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                              </svg>
                            </span>
                          )}
                        </>
                      ) : (
                        new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={listEndRef} />
          </div>
        )}
      </div>

      <div className={`border-t p-3 ${
        isDarkMode 
          ? 'border-slate-700 bg-slate-900' 
          : 'border-blue-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/30'
      }`}>
        {error ? <div className={`mb-2 text-sm ${
          isDarkMode ? 'text-red-300' : 'text-red-600'
        }`}>{error}</div> : null}
        <div className="flex items-end gap-2">
          <textarea
            className={`min-h-[44px] flex-1 resize-none rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
              isDarkMode
                ? 'border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20'
                : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-blue-400 focus:ring-blue-400/20 shadow-sm'
            }`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sendDisabled) void handleSend();
              }
            }}
            placeholder="Type a message..."
          />
          <button
            type="button"
            disabled={sendDisabled}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none"
            onClick={handleSend}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}


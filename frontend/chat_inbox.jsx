import React, { useEffect, useMemo, useState } from 'react';
import { getApiBase } from './api.js';
import ChatComponent from './chat_component.jsx';
import { Search, ArrowLeft, X, MessageCircle, User, Loader2, Send } from 'lucide-react';

function formatTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatInbox({ onClose, isDarkMode = false }) {
  const apiBase = useMemo(() => getApiBase(), []);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeThread, setActiveThread] = useState(null);
  const [query, setQuery] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversation, setShowConversation] = useState(false);

  const fetchThreads = async ({ keepSelection = true } = {}) => {
    try {
      if (!keepSelection) setLoading(true);
      const res = await fetch(`${apiBase}/chat.php?action=threads`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok !== true) throw new Error(data.error || 'Failed to load chats');
      const nextThreads = Array.isArray(data.threads) ? data.threads : [];
      setThreads(nextThreads);

      if (!keepSelection && nextThreads.length > 0 && !activeThread) {
        setActiveThread(nextThreads[0]);
      } else if (activeThread) {
        const updated = nextThreads.find((t) => t.thread_key === activeThread.thread_key);
        if (updated) setActiveThread(updated);
      }
      setError('');
    } catch (e) {
      setError(e?.message || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchThreads({ keepSelection: false });
    const timer = setInterval(() => void fetchThreads(), 2000);
    
    // Detect mobile view
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', checkMobileView);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleThreadSelect = (thread) => {
    setActiveThread(thread);
    if (isMobileView) {
      setShowConversation(true);
    }
  };

  const handleBackToList = () => {
    setShowConversation(false);
    setActiveThread(null);
  };

  const filteredThreads = threads.filter((thread) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    const name = String(thread?.other_user?.full_name || '').toLowerCase();
    return name.includes(q);
  });

  return (
    <div className={`flex h-[80vh] w-full overflow-hidden rounded-2xl shadow-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700/80 text-slate-100' : 'bg-white border-slate-200/60'}`}>
      {/* Mobile: Show conversation view */}
      {isMobileView && showConversation && activeThread ? (
        <div className="flex flex-col w-full h-full">
          {/* Mobile Header */}
          <div className={`flex items-center justify-between border-b p-4 ${isDarkMode ? 'border-slate-700/70 bg-slate-900' : 'border-slate-200/60 bg-gradient-to-r from-white to-slate-50'}`}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBackToList}
                className={`rounded-xl p-2 transition-all duration-200 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}
              >
                <ArrowLeft className={`w-5 h-5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-sm">
                    {activeThread?.other_user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <div className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{activeThread?.other_user?.full_name}</div>
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Active now
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`rounded-xl p-2 transition-all duration-200 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}
            >
              <X className={`w-5 h-5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`} />
            </button>
          </div>
          
          {/* Chat Component */}
          <div className="flex-1 overflow-hidden">
            <ChatComponent
              withUserId={activeThread.other_user.id}
              propertyId={null}
              onClose={onClose}
              peerName={activeThread.other_user.full_name}
              propertyLabel=""
              onConversationUpdated={() => void fetchThreads()}
              showHeader={false}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Chat List - Always visible on desktop, hidden on mobile when conversation is open */}
          {(!isMobileView || !showConversation) && (
            <div className={`${isMobileView ? 'w-full' : 'max-w-[380px]'} flex flex-col border-r ${
            isDarkMode 
              ? 'border-slate-700/70 bg-slate-900' 
              : 'border-slate-200/60 bg-gradient-to-b from-white to-blue-50/30'
          }`}>
              <div className={`border-b border-slate-200/60 p-6 shadow-lg ${
                isDarkMode
                  ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white'
                  : 'bg-gradient-to-r from-slate-50 to-blue-50/80 text-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2 backdrop-blur-sm transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-slate-600/30 text-slate-200'
                        : 'bg-white/60 text-slate-700 shadow-sm'
                    }`}>
                      <MessageCircle className={`w-6 h-6 transition-colors ${
                        isDarkMode ? 'text-slate-200' : 'text-slate-700'
                      }`} />
                    </div>
                    <div className={`text-xl font-bold tracking-tight transition-colors ${
                      isDarkMode ? 'text-slate-100' : 'text-slate-800'
                    }`}>Messages</div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className={`rounded-xl p-2 backdrop-blur-sm transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-slate-600/30 text-slate-200 hover:bg-slate-600/40'
                        : 'bg-white/60 text-slate-700 hover:bg-white/80 shadow-sm hover:shadow-md'
                    }`}
                    aria-label="Close messages"
                    title="Close messages"
                  >
                    <X className={`w-5 h-5 transition-colors ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-700'
                    }`} />
                  </button>
                </div>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                  <input
                    className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all duration-200 shadow-sm ${
                      isDarkMode
                        ? 'bg-slate-700/80 border border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:bg-slate-700'
                        : 'bg-white/90 border border-slate-300 text-slate-800 placeholder-slate-500 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-400/20'
                    }`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search conversations..."
                  />
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className={`flex items-center justify-center h-32 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin w-4 h-4" />
                      <span>Loading chats...</span>
                    </div>
                  </div>
                ) : null}
                {!loading && filteredThreads.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center h-32 text-sm p-6 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-200 ${
                      isDarkMode ? 'bg-slate-800' : 'bg-gradient-to-r from-slate-100 to-slate-200 shadow-sm'
                    }`}>
                      <MessageCircle className={`w-8 h-8 transition-colors ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-400'
                    }`} />
                    </div>
                    <p className={`font-medium transition-colors ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-700'
                    }`}>No conversations yet</p>
                    <p className={`text-xs mt-1 transition-colors ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}>Start chatting with renters to see messages here</p>
                  </div>
                ) : null}
                {filteredThreads.map((thread) => {
                  const selected = activeThread?.thread_key === thread.thread_key;
                  return (
                    <button
                      key={thread.thread_key}
                      type="button"
                      onClick={() => handleThreadSelect(thread)}
                      className={`block w-full border-b px-4 py-4 text-left transition-all duration-200 ${
                        selected 
                          ? `${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-slate-100/60'} border-l-4 border-l-blue-600 shadow-sm` 
                          : `${isDarkMode ? 'border-slate-700 hover:bg-slate-800 hover:border-l-slate-500' : 'border-slate-100/60 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/30 hover:border-l-slate-300'} hover:border-l-4 hover:shadow-sm`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                            selected 
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg' 
                              : isDarkMode
                                ? 'bg-gradient-to-r from-slate-600 to-slate-700'
                                : 'bg-gradient-to-r from-slate-200 to-slate-300 shadow-sm'
                          }`}>
                            <span className={`font-semibold text-sm transition-colors ${
                              selected ? 'text-white' : isDarkMode ? 'text-slate-200' : 'text-slate-600'
                            }`}>
                              {thread?.other_user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className={`font-bold truncate ${
                                selected ? (isDarkMode ? 'text-slate-100' : 'text-slate-900') : (isDarkMode ? 'text-slate-200' : 'text-slate-800')
                              }`}>
                                {thread?.other_user?.full_name || 'Unknown user'}
                              </div>
                              <div className="shrink-0 text-xs text-slate-500 font-medium">
                                {formatTime(thread?.last_created_at)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className={`text-sm truncate transition-colors ${
                                isDarkMode ? 'text-slate-300' : 'text-slate-600'
                              }`}>
                                {thread?.last_message || 'No messages yet'}
                              </div>
                              {thread.unread_count > 0 ? (
                                <span className="inline-flex min-w-6 h-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-2 py-1 text-xs font-bold text-white shadow-lg">
                                  {thread.unread_count}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {error ? (
                  <div className={`p-4 text-sm border-t flex items-start gap-3 ${isDarkMode ? 'text-red-300 bg-red-950/40 border-red-900/50' : 'text-red-700 bg-red-50 border-red-200'}`}>
                    <X className="w-4 h-4 text-red-500 mt-0.5" />
                    <span>{error}</span>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Chat Conversation - Desktop only or mobile when not showing list */}
          {(!isMobileView || showConversation) && (
            <div className="min-w-0 flex-1 flex flex-col">
              {activeThread ? (
                <>
                  {/* Desktop Header */}
                  {!isMobileView && (
                    <div className={`flex items-center justify-between border-b p-4 transition-all duration-200 ${
                      isDarkMode 
                        ? 'border-slate-700/70 bg-slate-900' 
                        : 'border-slate-200/60 bg-gradient-to-r from-white to-blue-50/50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-sm">
                            {activeThread?.other_user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <div className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{activeThread?.other_user?.full_name}</div>
                          <div className={`text-xs flex items-center gap-1 transition-colors ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`}>
                            <div className={`w-2 h-2 rounded-full animate-pulse transition-colors ${
                              isDarkMode ? 'bg-green-400' : 'bg-green-500'
                            }`}></div>
                            Active now
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className={`rounded-xl p-2 transition-all duration-200 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}
                      >
                        <X className={`w-5 h-5 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`} />
                      </button>
                    </div>
                  )}
                  
                  {/* Chat Component */}
                  <div className="flex-1 overflow-hidden">
                    <ChatComponent
                      withUserId={activeThread.other_user.id}
                      propertyId={null}
                      onClose={onClose}
                      peerName={activeThread.other_user.full_name}
                      propertyLabel=""
                      onConversationUpdated={() => void fetchThreads()}
                      showHeader={false}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </>
              ) : (
                <div className={`flex h-full items-center justify-center p-6 transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-slate-900' 
                    : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20'
                }`}>
                  <div className="text-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-all duration-200 ${
                      isDarkMode ? 'bg-slate-800' : 'bg-gradient-to-r from-slate-200 to-slate-300'
                    }`}>
                      <MessageCircle className={`w-12 h-12 transition-colors ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-500'
                    }`} />
                    </div>
                    <h3 className={`text-xl font-bold mb-3 transition-colors ${
                      isDarkMode ? 'text-slate-100' : 'text-slate-900'
                    }`}>Select a conversation</h3>
                    <p className={`text-sm max-w-md mx-auto transition-colors ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}>Choose a chat from the list to start messaging with renters</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

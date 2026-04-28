import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { getApiBase } from './api.js';

function clampText(s, max = 120) {
  const str = s ?? '';
  if (str.length <= max) return str;
  return str.slice(0, max) + '…';
}

function PhotoGallery({ photos, initialIndex = 0 }) {
  const [idx, setIdx] = useState(initialIndex);
  const startX = useRef(null);

  useEffect(() => setIdx(initialIndex), [initialIndex]);

  if (!photos || photos.length === 0) {
    return (
      <div className="aspect-[4/3] w-full rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-gray-400 text-center">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No photos available</p>
        </div>
      </div>
    );
  }

  const current = photos[idx];
  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx((i) => (i + 1) % photos.length);

  return (
    <div className="group relative">
      <div
        className="relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:shadow-xl"
        onTouchStart={(e) => {
          startX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (startX.current == null) return;
          const endX = e.changedTouches[0]?.clientX ?? null;
          const delta = (endX ?? 0) - startX.current;
          if (Math.abs(delta) < 25) return;
          if (delta > 0) prev();
          else next();
          startX.current = null;
        }}
      >
        <img 
          src={current} 
          alt="Property photo" 
          className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {photos.length > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur-sm p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
              aria-label="Previous photo"
            >
              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur-sm p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110"
              aria-label="Next photo"
            >
              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        ) : null}
      </div>

      {photos.length > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-2">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={`h-2 transition-all duration-300 ${i === idx ? 'w-8 bg-blue-600 rounded-full' : 'w-2 bg-gray-300 rounded-full hover:bg-gray-400'}`}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function PropertyList({ onChat, onFavoriteChanged, notificationPropertyId, onNotificationHandled, darkMode = false }) {
  const apiBase = useMemo(() => getApiBase(), []);

  const propertyTypes = ['All', 'Residential', 'Shop for Rent', 'Event Hall'];
  const [type, setType] = useState(propertyTypes[0]);
  const [city, setCity] = useState('');
  const [subcity, setSubcity] = useState('');
  const [q, setQ] = useState('');

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [subcitySuggestions, setSubcitySuggestions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailPhotoIdx, setDetailPhotoIdx] = useState(0);
  const [lastUpdateCheck, setLastUpdateCheck] = useState(Date.now());

  const closeDetail = () => {
    setDetailOpen(false);
    setDetail(null);
  };

  useEffect(() => {
    const t = setTimeout(async () => {
      const query = city.trim();
      if (query.length < 2) {
        setCitySuggestions([]);
        return;
      }
      try {
        const res = await fetch(`${apiBase}/properties.php?action=city_autocomplete&q=${encodeURIComponent(query)}`, {
          credentials: 'include',
        });
        const data = await res.json().catch(() => ({}));
        if (data.ok) setCitySuggestions(data.items || []);
      } catch {
        // ignore
      }
    }, 250);
    return () => clearTimeout(t);
  }, [city, apiBase]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const cityValue = city.trim();
      const query = subcity.trim();
      if (!cityValue || query.length < 2) {
        setSubcitySuggestions([]);
        return;
      }
      try {
        const res = await fetch(
          `${apiBase}/properties.php?action=subcity_autocomplete&city=${encodeURIComponent(cityValue)}`,
          { credentials: 'include' }
        );
        const data = await res.json().catch(() => ({}));
        if (data.ok) setSubcitySuggestions(data.items || []);
      } catch {
        // ignore
      }
    }, 250);
    return () => clearTimeout(t);
  }, [city, subcity, apiBase]);

  // Handle notification property ID to auto-open property detail
  useEffect(() => {
    if (notificationPropertyId) {
      openDetail(notificationPropertyId);
      onNotificationHandled();
    }
  }, [notificationPropertyId]);

  // Real-time updates polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${apiBase}/realtime_updates.php?action=check_property_updates&last_check=${Math.floor(lastUpdateCheck / 1000)}`, {
          credentials: 'include',
        });
        const data = await res.json().catch(() => ({}));
        if (data.ok && data.new_properties && data.new_properties.length > 0) {
          // Refresh the search results if new properties are available
          await fetchSearch();
          setLastUpdateCheck(Date.now());
        }
      } catch {
        // Ignore polling errors
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [lastUpdateCheck, apiBase]);

  const fetchSearch = useCallback(async () => {
    setLoading(true);
    setError('');
    setShowAll(false); // Reset showAll when performing new search
    try {
      const params = new URLSearchParams();
      if (city.trim()) params.set('city', city.trim());
      if (subcity.trim()) params.set('subcity', subcity.trim());
      if (type.trim() && type !== 'All') params.set('type', type.trim());
      if (q.trim()) params.set('q', q.trim());

      const res = await fetch(`${apiBase}/properties.php?action=search&${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!data.ok) {
        setError(data.error || 'Search failed');
        setItems([]);
        return;
      }
      setItems(data.items || []);
    } catch {
      setError('Network error while searching.');
    } finally {
      setLoading(false);
    }
  }, [apiBase, city, subcity, type, q]);

  // Auto-search when Property Type is set to 'All'
  useEffect(() => {
    if (type === 'All') {
      fetchSearch();
    }
  }, [type, fetchSearch]);

  const openDetail = async (propertyId) => {
    try {
      const res = await fetch(`${apiBase}/property_detail.php?property_id=${encodeURIComponent(propertyId)}`, {
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!data.ok) throw new Error(data.error || 'Failed');
      setDetail(data);
      setDetailPhotoIdx(0);
      setDetailOpen(true);
    } catch (e) {
      setError(e?.message || 'Failed to open property details');
    }
  };

  const handleChatOwner = async (propertyId) => {
    try {
      const res = await fetch(`${apiBase}/property_detail.php?property_id=${encodeURIComponent(propertyId)}`, {
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!data.ok) throw new Error(data.error || 'Failed');
      if (onChat && data.property?.owner?.id) {
        onChat({ withUserId: data.property.owner.id, propertyId });
      }
    } catch {
      // ignore
    }
  };

  const photos = detail?.photos ? detail.photos.map((p) => p.image_path) : [];
  const prop = detail?.property;

  const toggleFavorite = async () => {
    if (!detail || !prop?.id) return;
    const isFav = !!detail.is_favorite;
    const action = isFav ? 'remove' : 'add';
    try {
      const res = await fetch(`${apiBase}/favorites.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ property_id: prop.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok !== true) throw new Error(data.error || 'Favorite update failed');
      setDetail((prev) => (prev ? { ...prev, is_favorite: !isFav } : prev));
      if (onFavoriteChanged) onFavoriteChanged();
    } catch {
      // ignore (keep UI unchanged)
    }
  };

  return (
    <div className={`rounded-3xl shadow-xl ring-1 p-8 ${darkMode ? 'bg-slate-800 ring-slate-700' : 'bg-white ring-gray-100'}`}>
      {/* Header Section */}
      <div className="mb-8">
        <h2 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Find Your Perfect Home</h2>
        <p className={darkMode ? 'text-slate-300' : 'text-gray-600'}>Discover amazing properties in your preferred location</p>
      </div>

      {/* Search Form */}
      <div className={`rounded-2xl p-6 mb-6 ${darkMode ? 'bg-gradient-to-r from-slate-700 to-slate-800' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              <svg className="w-4 h-4 inline mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              City
            </label>
            <div className="relative">
              <input
                className={`w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 transition-all duration-200 shadow-sm ${
                  darkMode 
                    ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-blue-500/20 placeholder-slate-400' 
                    : 'border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-200'
                }`}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city name"
                list="city-suggestions"
              />
              <datalist id="city-suggestions">
                {citySuggestions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              <svg className="w-4 h-4 inline mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Sub-city / Neighborhood
            </label>
            <div className="relative">
              <input
                className={`w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 transition-all duration-200 shadow-sm disabled:cursor-not-allowed ${
                  darkMode 
                    ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-blue-500/20 placeholder-slate-400 disabled:bg-slate-800 disabled:text-slate-500' 
                    : 'border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-200 disabled:bg-gray-50 disabled:cursor-not-allowed'
                }`}
                value={subcity}
                onChange={(e) => setSubcity(e.target.value)}
                placeholder="Enter sub-city"
                list="subcity-suggestions"
                disabled={!city.trim()}
              />
              <datalist id="subcity-suggestions">
                {subcitySuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-2">
            <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              <svg className="w-4 h-4 inline mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Property Type
            </label>
            <select 
              className={`w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 transition-all duration-200 shadow-sm appearance-none cursor-pointer ${
                darkMode 
                  ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-blue-500/20' 
                  : 'border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-200'
              }`} 
              value={type} 
              onChange={(e) => setType(e.target.value)}
            >
              {propertyTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={fetchSearch}
            className="group relative px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={loading}
          >
            <span className="flex items-center">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Properties
                </>
              )}
            </span>
          </button>
          {error ? (
            <div className="flex items-center text-red-600 text-sm font-medium">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          ) : null}
        </div>
      </div>

      {/* Results Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
            {items.length > 0 ? `Found ${items.length} Properties` : 'Search Results'}
          </h3>
          {items.length > 0 && (
            <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Showing all available properties
            </div>
          )}
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                <svg className={`w-10 h-10 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>No properties found</h3>
              <p className={`mb-4 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Try adjusting your search filters or browse different locations</p>
              <button
                onClick={() => {
                  setCity('');
                  setSubcity('');
                  setQ('');
                  setType(propertyTypes[0]);
                  setShowAll(false);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {(showAll ? items : items.slice(0, 6)).map((item) => (
              <div 
                key={item.id} 
                className={`group relative rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border cursor-pointer transform hover:-translate-y-1 ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700 hover:border-blue-600' 
                    : 'bg-white border-gray-100 hover:border-blue-300'
                }`}
                onClick={() => openDetail(item.id)}
              >
                {/* Property Image with Better Aspect Ratio */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  {item.cover_photo ? (
                    <img 
                      src={item.cover_photo} 
                      alt="Property cover" 
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  ) : (
                    <div className={`h-full w-full flex items-center justify-center ${
                      darkMode 
                        ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900' 
                        : 'bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200'
                    }`}>
                      <div className="text-center">
                        <svg className="w-20 h-20 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>No Photo Available</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Image Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Price Badge - Modern Design */}
                  <div className={`absolute top-3 left-3 px-3 py-2 rounded-xl shadow-lg backdrop-blur-md border ${
                    darkMode 
                      ? 'bg-slate-800/95 border-slate-700' 
                      : 'bg-white/95 border-white/20'
                  }`}>
                    <div className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{Number(item.price).toLocaleString()}</div>
                    <div className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      ETB/{item.property_type === 'Event Hall' ? 'day' : 'month'}
                    </div>
                  </div>
                  
                  {/* Views Badge - Redesigned */}
                  <div className={`absolute top-3 right-3 px-2.5 py-1.5 rounded-lg shadow-md backdrop-blur-md border ${
                    darkMode 
                      ? 'bg-slate-800/90 border-slate-700' 
                      : 'bg-white/90 border-white/20'
                  }`}>
                    <div className={`flex items-center text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {item.views_count}
                    </div>
                  </div>

                  {/* Property Type Badge */}
                  <div className="absolute bottom-3 left-3">
                    <div className="bg-blue-600/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <div className="text-xs font-semibold text-white uppercase tracking-wide">
                        {item.property_type || 'Residential'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Property Details - Enhanced Layout */}
                <div className="p-4 space-y-3">
                  {/* Location Section */}
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <h3 className="text-lg font-bold">
                        {item.city}, {item.subcity}
                      </h3>
                    </div>
                    <div className={`flex items-start gap-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="line-clamp-2 leading-relaxed">
                        {clampText(item.real_address, 90)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons - Modern Design */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetail(item.id);
                      }}
                      className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-1.5 ${
                        darkMode 
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChatOwner(item.id);
                      }}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Chat Owner
                    </button>
                  </div>
                </div>

                {/* Subtle Hover Effect Border */}
                <div className={`absolute inset-0 rounded-3xl border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
                  darkMode ? 'border-blue-600' : 'border-blue-200'
                }`} />
              </div>
              ))}
              
              {/* See More / Show Less Button */}
              {items.length > 6 && (
                <div className="col-span-full flex justify-center mt-8">
                  <button
                    type="button"
                    onClick={() => setShowAll(!showAll)}
                    className="group px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span className="flex items-center">
                      {showAll ? (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Show Less Properties
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          See More Properties ({items.length - 6} more)
                        </>
                      )}
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Property Detail Modal */}
      {detailOpen && prop ? (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
              onClick={closeDetail}
            />
            <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 ${
              darkMode ? 'bg-slate-800' : 'bg-white'
            }`}>
              {/* Modal Header */}
              <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white p-6">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-white/20" style={{
                    backgroundImage: 'radial-gradient(circle at 25% 25%, white 0%, transparent 50%), radial-gradient(circle at 75% 75%, white 0%, transparent 50%)',
                  }} />
                </div>
                
                <div className="relative flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">{prop.city} - {prop.subcity}</h3>
                    <div className="flex items-center gap-6 text-blue-100">
                      <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">{Number(prop.price).toLocaleString()} ETB / {prop.property_type === 'Event Hall' ? 'day' : 'month'}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="font-semibold">{prop.views_count} views</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 backdrop-blur-sm hover:scale-110"
                    onClick={closeDetail}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="max-h-[75vh] overflow-y-auto">
                <div className="p-6 space-y-8">
                  {/* Photo Gallery */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                        darkMode ? 'text-slate-100' : 'text-gray-900'
                      }`}>Property Photos</h4>
                      <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Swipe to view all photos</div>
                    </div>
                    <div className="max-w-full">
                      <PhotoGallery photos={photos} initialIndex={detailPhotoIdx} />
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="space-y-6">
                    <div>
                      <h4 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                        darkMode ? 'text-slate-100' : 'text-gray-900'
                      }`}>
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Property Information
                      </h4>
                      <div className={`rounded-2xl p-6 space-y-4 ${
                        darkMode 
                          ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600' 
                          : 'bg-gradient-to-br from-gray-50 to-blue-50 border-gray-200'
                      } border`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className={`text-sm font-semibold uppercase tracking-wide flex items-center gap-2 ${
                              darkMode ? 'text-slate-300' : 'text-gray-600'
                            }`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Full Address
                            </label>
                            <p className={`font-medium px-4 py-3 rounded-xl border ${
                              darkMode 
                                ? 'text-slate-100 bg-slate-700 border-slate-600' 
                                : 'text-gray-900 bg-white border-gray-200'
                            }`}>{prop.real_address}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <label className={`text-sm font-semibold uppercase tracking-wide flex items-center gap-2 ${
                              darkMode ? 'text-slate-300' : 'text-gray-600'
                            }`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                              Property Type
                            </label>
                            <p className={`font-medium px-4 py-3 rounded-xl border ${
                              darkMode 
                                ? 'text-slate-100 bg-slate-700 border-slate-600' 
                                : 'text-gray-900 bg-white border-gray-200'
                            }`}>{prop.property_type || 'Residential'}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <label className={`text-sm font-semibold uppercase tracking-wide flex items-center gap-2 ${
                              darkMode ? 'text-slate-300' : 'text-gray-600'
                            }`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Owner
                            </label>
                            <p className={`font-medium px-4 py-3 rounded-xl border ${
                              darkMode 
                                ? 'text-slate-100 bg-slate-700 border-slate-600' 
                                : 'text-gray-900 bg-white border-gray-200'
                            }`}>{prop.owner.full_name}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <label className={`text-sm font-semibold uppercase tracking-wide flex items-center gap-2 ${
                              darkMode ? 'text-slate-300' : 'text-gray-600'
                            }`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Location
                            </label>
                            <p className={`font-medium px-4 py-3 rounded-xl border ${
                              darkMode 
                                ? 'text-slate-100 bg-slate-700 border-slate-600' 
                                : 'text-gray-900 bg-white border-gray-200'
                            }`}>{prop.city}, {prop.subcity}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                        darkMode ? 'text-slate-100' : 'text-gray-900'
                      }`}>
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Description
                      </h4>
                      <div className={`rounded-2xl p-6 ${
                        darkMode 
                          ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600' 
                          : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                      } border`}>
                        <p className={`leading-relaxed whitespace-pre-wrap ${
                          darkMode ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                          {prop.description || 'No description provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rental Rules */}
                  {prop.rules && (
                    <div>
                      <h4 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                        darkMode ? 'text-slate-100' : 'text-gray-900'
                      }`}>
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Rental Rules
                      </h4>
                      <div className={`rounded-2xl p-6 ${
                        darkMode 
                          ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600' 
                          : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                      } border`}>
                        <p className={`leading-relaxed whitespace-pre-wrap ${
                          darkMode ? 'text-slate-300' : 'text-gray-700'
                        }`}>{prop.rules}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className={`flex flex-col sm:flex-row gap-4 pt-6 border-t ${
                      darkMode ? 'border-slate-700' : 'border-gray-200'
                    }`}>
                    <button
                      type="button"
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
                      onClick={() => {
                        if (onChat && prop.owner?.id) onChat({ withUserId: prop.owner.id, propertyId: prop.id });
                        closeDetail();
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Message Owner
                    </button>
                    
                    <button
                      type="button"
                      className={`flex-1 px-6 py-4 font-bold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3 ${
                        detail?.is_favorite
                          ? darkMode 
                            ? 'bg-gray-900 text-white hover:bg-gray-800'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                          : darkMode 
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
                      }`}
                      onClick={toggleFavorite}
                    >
                      {detail?.is_favorite ? (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          Remove from Favorites
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Add to Favorites
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


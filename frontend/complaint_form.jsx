import React, { useEffect, useMemo, useState } from 'react';
import { getApiBase } from './api.js';
import { readStoredUser } from './authStorage.js';

const complaintTypes = [
  { value: 'complaint', label: 'Complaint', description: 'Report an issue or problem' },
  { value: 'feedback', label: 'Feedback', description: 'Share your experience or suggestions' },
  { value: 'suggestion', label: 'Suggestion', description: 'Ideas for improvement' },
  { value: 'bug_report', label: 'Bug Report', description: 'Report technical issues' },
  { value: 'other', label: 'Other', description: 'General inquiry or other' }
];

const complaintCategories = [
  { value: 'property', label: 'Property Related', description: 'Issues with a specific property' },
  { value: 'user_behavior', label: 'User Behavior', description: 'Issues with another user' },
  { value: 'payment', label: 'Payment', description: 'Payment or billing issues' },
  { value: 'technical', label: 'Technical', description: 'Website or app technical problems' },
  { value: 'service', label: 'Service', description: 'Customer service or platform issues' },
  { value: 'safety', label: 'Safety', description: 'Safety concerns or violations' },
  { value: 'other', label: 'Other', description: 'Other issues not listed above' }
];

const priorityLevels = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700', description: 'Minor issue, not urgent' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700', description: 'Important but not urgent' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700', description: 'Urgent, needs attention' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700', description: 'Critical, immediate attention needed' }
];

export default function ComplaintForm({ onClose, onSuccess, darkMode = false }) {
  const apiBase = useMemo(() => getApiBase(), []);
  
  const [formData, setFormData] = useState({
    type: 'complaint',
    category: 'other',
    title: '',
    description: '',
    priority: 'medium',
    related_property_id: '',
    related_user_id: ''
  });
  
  const [userProperties, setUserProperties] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const currentUser = useMemo(() => readStoredUser(), []);

  // Load user's properties if they are an owner
  useEffect(() => {
    if (currentUser?.role === 'owner') {
      const fetchProperties = async () => {
        try {
          const res = await fetch(`${apiBase}/properties.php?action=my_properties`, {
            credentials: 'include',
          });
          const data = await res.json().catch(() => ({}));
          if (data.ok) {
            setUserProperties(data.items || []);
          }
        } catch {
          // Ignore errors
        }
      };
      fetchProperties();
    }
  }, [currentUser, apiBase]);

  // Load available users for user-related complaints
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${apiBase}/complaints.php?action=list&limit=100`, {
          credentials: 'include',
        });
        const data = await res.json().catch(() => ({}));
        if (data.ok && data.items) {
          // Extract unique users from complaints (excluding current user)
          const uniqueUsers = new Set();
          data.items.forEach(item => {
            if (item.related_user_id && item.related_user_id !== currentUser?.id) {
              uniqueUsers.add(JSON.stringify({
                id: item.related_user_id,
                name: item.related_user_name
              }));
            }
          });
          
          // For demo purposes, add some sample users
          const sampleUsers = [
            { id: 1, name: 'Admin User' },
            { id: 2, name: 'Sample Owner' },
            { id: 3, name: 'Sample Renter' }
          ].filter(u => u.id !== currentUser?.id);
          
          setAvailableUsers(sampleUsers);
        }
      } catch {
        // Ignore errors
      }
    };
    fetchUsers();
  }, [currentUser, apiBase]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    if (formData.title.trim().length < 3) {
      setError('Title must be at least 3 characters long');
      return false;
    }
    if (formData.title.length > 255) {
      setError('Title is too long (maximum 255 characters)');
      return false;
    }
    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      return false;
    }
    if (formData.category === 'user_behavior' && !formData.related_user_id) {
      setError('Please select a user for user behavior complaints');
      return false;
    }
    if (formData.category === 'property' && !formData.related_property_id) {
      setError('Please select a property for property-related complaints');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;

    setSubmitting(true);
    
    try {
      // Submit complaint
      const complaintData = {
        ...formData,
        related_property_id: formData.related_property_id || null,
        related_user_id: formData.related_user_id || null
      };

      const res = await fetch(`${apiBase}/complaints.php?action=submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(complaintData),
      });

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok || data.ok !== true) {
        throw new Error(data.error || 'Failed to submit complaint');
      }

      const complaintId = data.complaint_id;

      setSuccess(true);
      if (onSuccess) onSuccess(complaintId);
      
      // Reset form after delay
      setTimeout(() => {
        setFormData({
          type: 'complaint',
          category: 'other',
          title: '',
          description: '',
          priority: 'medium',
          related_property_id: '',
          related_user_id: ''
        });
        setSuccess(false);
        if (onClose) onClose();
      }, 2000);

    } catch (err) {
      setError(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className={`relative rounded-2xl shadow-2xl max-w-md w-full p-8 text-center transform animate-pulse ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 opacity-10 rounded-2xl"></div>
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Complaint Submitted Successfully!</h3>
            <p className={`leading-relaxed ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Your complaint has been submitted and will be reviewed by our admin team. We'll get back to you soon.</p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-green-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Reference ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-2 sm:items-center sm:p-4">
      <div className={`relative rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 opacity-5"></div>
        <div className="relative">
          <div className={`flex items-center justify-between p-6 border-b ${
            darkMode 
              ? 'border-slate-700 bg-gradient-to-r from-slate-700 to-slate-800' 
              : 'border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 p-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Submit Complaint or Feedback</h2>
                <p className={`text-sm mt-1 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>We're here to help and improve your experience</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`group p-2 rounded-xl transition-all hover:scale-110 ${
                darkMode ? 'hover:bg-slate-700' : 'hover:bg-white/50'
              }`}
            >
              <svg className={`w-5 h-5 transition-colors ${
                darkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-gray-500 group-hover:text-gray-700'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex min-h-0 flex-col" style={{ height: 'calc(95vh - 110px)' }}>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-6">
            {/* Type Selection */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <label className={`text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>What type of feedback is this?</label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {complaintTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`group relative flex cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                      formData.type === type.value
                        ? darkMode
                          ? 'border-blue-500 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 shadow-lg scale-105'
                          : 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-105'
                        : darkMode
                          ? 'border-slate-600 bg-slate-700 hover:border-blue-400 hover:shadow-md'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-500'
                          : darkMode
                            ? 'border-slate-500 group-hover:border-blue-400'
                            : 'border-gray-300 group-hover:border-blue-400'
                      }`}>
                        {formData.type === type.value && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold group-hover:text-blue-600 ${
                          darkMode ? 'text-slate-100' : 'text-gray-900'
                        }`}>{type.label}</div>
                        <div className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>{type.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
                <label className={`text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Select a category</label>
              </div>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full rounded-xl border-2 px-4 py-3 pr-10 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all appearance-none cursor-pointer hover:border-gray-300 ${
                    darkMode 
                      ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-purple-500/20' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {complaintCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label} - {category.description}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Priority Selection */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <label className={`text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>How urgent is this?</label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {priorityLevels.map((priority) => (
                  <label
                    key={priority.value}
                    className={`group relative flex cursor-pointer rounded-xl border-2 p-3 text-center transition-all duration-200 ${
                      formData.priority === priority.value
                        ? darkMode
                          ? 'border-orange-500 bg-gradient-to-br from-orange-900/20 to-red-900/20 shadow-lg scale-105'
                          : 'border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 shadow-lg scale-105'
                        : darkMode
                          ? 'border-slate-600 bg-slate-700 hover:border-orange-300 hover:shadow-md'
                          : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-md'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={priority.value}
                      checked={formData.priority === priority.value}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        priority.value === 'low' ? 'bg-gray-400' :
                        priority.value === 'medium' ? 'bg-blue-400' :
                        priority.value === 'high' ? 'bg-orange-400' :
                        'bg-red-400'
                      }`}></div>
                      <div className={`text-sm font-semibold group-hover:text-orange-600 ${
                        darkMode ? 'text-slate-100' : 'text-gray-900'
                      }`}>{priority.label}</div>
                      <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{priority.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Related Property (for owners or property-related complaints) */}
            {(currentUser?.role === 'owner' || formData.category === 'property') && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <label className={`text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                    Related Property {formData.category === 'property' ? '(Required)' : '(Optional)'}
                  </label>
                </div>
                <div className="relative">
                  <select
                    value={formData.related_property_id}
                    onChange={(e) => handleInputChange('related_property_id', e.target.value)}
                    className={`w-full rounded-xl border-2 px-4 py-3 pr-10 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all appearance-none cursor-pointer hover:border-gray-300 ${
                      darkMode 
                        ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-green-500/20' 
                        : 'border-gray-200 bg-white'
                    }`}
                    required={formData.category === 'property'}
                  >
                    <option value="">Select a property</option>
                    {userProperties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.city} - {property.subcity} ({property.status})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Related User (for user behavior complaints) */}
            {formData.category === 'user_behavior' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <label className={`text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Related User (Required)</label>
                </div>
                <div className="relative">
                  <select
                    value={formData.related_user_id}
                    onChange={(e) => handleInputChange('related_user_id', e.target.value)}
                    className={`w-full rounded-xl border-2 px-4 py-3 pr-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all appearance-none cursor-pointer hover:border-gray-300 ${
                      darkMode 
                        ? 'border-slate-600 bg-slate-700 text-slate-100 focus:ring-indigo-500/20' 
                        : 'border-gray-200 bg-white'
                    }`}
                    required
                  >
                    <option value="">Select a user</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <label className={`text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Title</label>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Brief summary of your complaint or feedback"
                  className={`w-full rounded-xl border-2 px-4 py-3 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all hover:border-gray-300 ${
                    darkMode 
                      ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 focus:ring-cyan-500/20' 
                      : 'border-gray-200 bg-white'
                  }`}
                  maxLength={255}
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className={`text-sm font-medium ${
                    formData.title.length > 200 ? 'text-red-500' :
                    formData.title.length > 150 ? 'text-orange-500' :
                    darkMode ? 'text-slate-400' : 'text-gray-400'
                  }`}>
                    {formData.title.length}/255
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <label className={`text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>Description</label>
              </div>
              <div className="relative">
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Please provide detailed information about your complaint or feedback. The more details you provide, the better we can assist you."
                  rows={5}
                  className={`w-full rounded-xl border-2 px-4 py-3 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all hover:border-gray-300 resize-none ${
                    darkMode 
                      ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 focus:ring-teal-500/20' 
                      : 'border-gray-200 bg-white'
                  }`}
                  required
                />
                <div className="absolute bottom-3 right-3">
                  <span className={`text-sm font-medium ${
                    formData.description.length < 10 ? 'text-orange-500' :
                    formData.description.length > 500 ? 'text-red-500' :
                    darkMode ? 'text-slate-400' : 'text-gray-400'
                  }`}>
                    {formData.description.length} characters
                  </span>
                </div>
              </div>
              <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Minimum 10 characters. Please be as detailed as possible.</p>
            </div>

            
            {/* Error Display */}
            {error && (
              <div className={`relative rounded-xl border-2 p-4 ${
                darkMode 
                  ? 'bg-red-900/20 border-red-800' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                    darkMode ? 'bg-red-800' : 'bg-red-100'
                  }`}>
                    <svg className={`w-4 h-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-red-400' : 'text-red-800'}`}>Error</h4>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        
        {/* Submit Buttons - Sticky at bottom */}
        <div className={`sticky bottom-0 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 ${
          darkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-white'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              className={`group w-full sm:w-auto px-6 py-3 text-sm font-semibold border-2 rounded-xl transition-all hover:scale-105 ${
                darkMode 
                  ? 'text-slate-300 bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500' 
                  : 'text-gray-700 bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                Cancel
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`group w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white border-2 border-transparent rounded-xl transition-all hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed ${
                darkMode 
                  ? 'bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-800 hover:to-pink-800 disabled:from-slate-600 disabled:to-slate-700' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Complaint
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
        </form>
        </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { getApiBase } from './api.js';

const statusColors = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  in_progress: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  resolved: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  rejected: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  closed: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'
};

const priorityColors = {
  low: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700',
  medium: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  high: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
  urgent: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
};

const typeColors = {
  complaint: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  feedback: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  suggestion: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  bug_report: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
  other: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'
};

export default function AdminComplaints({ embedded = false }) {
  const apiBase = useMemo(() => getApiBase(), []);
  
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: ''
  });
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0
  });

  // Fetch complaints list
  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });
      
      const res = await fetch(`${apiBase}/complaints.php?action=list&${params}`, {
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      
      if (data.ok) {
        setComplaints(data.items || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
        
        // Mark complaint notifications as read
        markComplaintNotificationsAsRead();
      } else {
        setError(data.error || 'Failed to fetch complaints');
      }
    } catch (err) {
      setError('Network error while fetching complaints');
    } finally {
      setLoading(false);
    }
  };

  // Mark complaint notifications as read
  const markComplaintNotificationsAsRead = async () => {
    try {
      const res = await fetch(`${apiBase}/notifications.php?action=mark_read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          type: 'new_complaint' 
        }),
      });
      
      const data = await res.json().catch(() => ({}));
      if (data.ok && data.marked_count > 0) {
        // Dispatch event to update notification count in real-time
        window.dispatchEvent(new CustomEvent('complaintNotificationsRead', {
          detail: { type: 'new_complaint', markedCount: data.marked_count }
        }));
      }
    } catch (err) {
      // Silently fail - notification count will update on next poll
    }
  };

  // Fetch complaint details
  const fetchComplaintDetails = async (complaintId) => {
    try {
      const res = await fetch(`${apiBase}/complaints.php?action=detail&complaint_id=${complaintId}`, {
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      
      if (data.ok) {
        setSelectedComplaint(data);
      } else {
        setError(data.error || 'Failed to fetch complaint details');
      }
    } catch (err) {
      setError('Network error while fetching complaint details');
    }
  };

  // Update complaint status
  const updateComplaintStatus = async (complaintId, status, adminResponse = '', resolutionDetails = '') => {
    try {
      const res = await fetch(`${apiBase}/complaints.php?action=update_status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          complaint_id: complaintId,
          status,
          admin_response: adminResponse,
          resolution_details: resolutionDetails
        }),
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (data.ok) {
        await fetchComplaints();
        if (selectedComplaint) {
          await fetchComplaintDetails(complaintId);
        }
      } else {
        setError(data.error || 'Failed to update complaint');
      }
    } catch (err) {
      setError('Network error while updating complaint');
    }
  };

  // Delete complaint
  const deleteComplaint = async (complaintId) => {
    if (!confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
      return;
    }
    
    try {
      const res = await fetch(`${apiBase}/complaints.php?action=delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ complaint_id: complaintId }),
      });
      
      const data = await res.json().catch(() => ({ ok: false }));
      
      if (data.ok) {
        await fetchComplaints();
        setSelectedComplaint(null);
      } else {
        setError(data.error || 'Failed to delete complaint');
      }
    } catch (err) {
      setError('Network error while deleting complaint');
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [filters, pagination.offset]);

  const ComplaintCard = ({ complaint }) => {
    return (
      <div 
        className="group cursor-pointer rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:scale-[1.02] dark:border-slate-700/60 dark:bg-slate-800 dark:hover:border-blue-500 dark:hover:shadow-blue-500/10" 
        onClick={() => fetchComplaintDetails(complaint.id)}
      >
        {/* Priority indicator bar */}
        <div className={`h-1 w-full rounded-t-2xl mb-4 ${
          complaint.priority === 'urgent' ? 'bg-red-500' :
          complaint.priority === 'high' ? 'bg-orange-500' :
          complaint.priority === 'medium' ? 'bg-blue-500' :
          'bg-gray-400'
        }`} />
        
        {/* Header with badges */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${typeColors[complaint.type]}`}>
                {complaint.type.replace('_', ' ').toUpperCase()}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${priorityColors[complaint.priority]}`}>
                {complaint.priority.toUpperCase()}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[complaint.status]}`}>
                {complaint.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors dark:text-white dark:group-hover:text-blue-400 line-clamp-1">
              {complaint.title}
            </h3>
            <p className="line-clamp-2 text-sm text-gray-600 leading-relaxed dark:text-gray-300">
              {complaint.description}
            </p>
          </div>
        </div>
        
        {/* Footer with submitter info and metadata */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0">
              {complaint.submitter_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-gray-900 text-sm dark:text-white truncate">
                {complaint.submitter_name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {complaint.submitter_role} • {complaint.submitter_phone}
              </div>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-xs text-gray-500 font-medium dark:text-gray-400 mb-1">
              {new Date(complaint.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: '2-digit'
              })}
            </div>
            {complaint.attachment_count > 0 && (
              <div className="flex items-center gap-1 justify-end">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="text-xs font-semibold">{complaint.attachment_count}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ComplaintDetail = () => {
    if (!selectedComplaint) return null;

    const { complaint, history, attachments } = selectedComplaint;
    
    const [statusForm, setStatusForm] = useState({
      status: complaint.status,
      admin_response: complaint.admin_response || '',
      resolution_details: complaint.resolution_details || ''
    });
    const [updating, setUpdating] = useState(false);

    const handleStatusUpdate = async () => {
      setUpdating(true);
      await updateComplaintStatus(
        complaint.id,
        statusForm.status,
        statusForm.admin_response,
        statusForm.resolution_details
      );
      setUpdating(false);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700">
          {/* Enhanced Header */}
          <div className="sticky top-0 z-10 bg-gray-800 dark:bg-slate-900 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Complaint Details</h2>
                <p className="text-gray-300 dark:text-gray-400 mt-1">Case #{complaint.id}</p>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="group rounded-lg bg-gray-700 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-600 dark:hover:bg-slate-600"
              >
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </span>
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Complaint Info */}
              <div className="space-y-6">
                {/* Complaint Information Card */}
                <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="bg-gray-100 dark:bg-slate-700 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Complaint Information
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${typeColors[complaint.type]}`}>
                        {complaint.type.replace('_', ' ')}
                      </span>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${priorityColors[complaint.priority]}`}>
                        {complaint.priority}
                      </span>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusColors[complaint.status]}`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 shadow-sm">
                        <span className="text-gray-700 dark:text-gray-300 font-medium block mb-1">Title</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{complaint.title}</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 shadow-sm">
                        <span className="text-gray-700 dark:text-gray-300 font-medium block mb-1">Category</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{complaint.category.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 shadow-sm">
                        <span className="text-gray-700 dark:text-gray-300 font-medium block mb-1">Submitted</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{new Date(complaint.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submitter Information Card */}
                <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="bg-gray-100 dark:bg-slate-700 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Submitter Information
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-slate-600 flex items-center justify-center text-gray-600 dark:text-gray-200 font-semibold text-xl">
                        {complaint.submitter_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{complaint.submitter_name}</div>
                        <div className="text-gray-600 dark:text-gray-400 font-medium">{complaint.submitter_role}</div>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 shadow-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium block mb-1">Phone</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{complaint.submitter_phone}</span>
                    </div>
                  </div>
                </div>

                {complaint.related_user_name && (
                  <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="bg-gray-100 dark:bg-slate-700 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Related User
                      </h3>
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 shadow-sm">
                        <span className="text-gray-700 dark:text-gray-300 font-medium block mb-1">Name</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{complaint.related_user_name}</span>
                      </div>
                      {complaint.related_user_phone && (
                        <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 shadow-sm">
                          <span className="text-gray-700 dark:text-gray-300 font-medium block mb-1">Phone</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{complaint.related_user_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {complaint.property_city && (
                  <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="bg-gray-100 dark:bg-slate-700 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Related Property
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 shadow-sm">
                        <span className="text-gray-700 dark:text-gray-300 font-medium block mb-1">Location</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{complaint.property_city} - {complaint.property_subcity}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description Card */}
                <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="bg-gray-100 dark:bg-slate-700 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Description
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-5 shadow-sm">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{complaint.description}</p>
                    </div>
                  </div>
                </div>

                {/* Attachments Card */}
                {attachments && attachments.length > 0 && (
                  <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="bg-gray-100 dark:bg-slate-700 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Attachments ({attachments.length})
                      </h3>
                    </div>
                    <div className="p-6 space-y-3">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-600">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-slate-600 flex items-center justify-center">
                                <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">{attachment.file_name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{(attachment.file_size / 1024).toFixed(1)} KB</div>
                              </div>
                            </div>
                            <a
                              href={`/${attachment.file_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group rounded-lg bg-gray-700 dark:bg-slate-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-600 dark:hover:bg-slate-500 flex items-center gap-2"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              View
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Status Management */}
              <div className="space-y-6">
                {/* Status Management Card */}
                <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="bg-gray-100 dark:bg-slate-700 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Status Management
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <select
                        value={statusForm.status}
                        onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-sm font-medium focus:border-gray-500 dark:focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-600 text-gray-900 dark:text-gray-100"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Admin Response</label>
                      <textarea
                        value={statusForm.admin_response}
                        onChange={(e) => setStatusForm(prev => ({ ...prev, admin_response: e.target.value }))}
                        placeholder="Enter your response to the complaint submitter"
                        rows={4}
                        className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-sm font-medium focus:border-gray-500 dark:focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>

                    {(statusForm.status === 'resolved' || statusForm.status === 'closed') && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Resolution Details</label>
                        <textarea
                          value={statusForm.resolution_details}
                          onChange={(e) => setStatusForm(prev => ({ ...prev, resolution_details: e.target.value }))}
                          placeholder="Describe how this complaint was resolved"
                          rows={3}
                          className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-sm font-medium focus:border-gray-500 dark:focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                        onClick={handleStatusUpdate}
                        disabled={updating}
                        className="group rounded-xl bg-gray-700 dark:bg-slate-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-gray-600 dark:hover:bg-slate-500 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {updating ? 'Updating...' : 'Update Status'}
                      </button>
                      <button
                        onClick={() => deleteComplaint(complaint.id)}
                        className="group rounded-xl bg-red-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-red-700 flex items-center justify-center gap-2"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status History Card */}
                {history && history.length > 0 && (
                  <div className="rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="bg-gray-100 dark:bg-slate-700 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Status History
                      </h3>
                    </div>
                    <div className="p-6 space-y-3">
                      {history.map((item, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-slate-600">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {item.old_status ? `${item.old_status} -> ${item.new_status}` : `Created as ${item.new_status}`}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {new Date(item.changed_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            By: <span className="font-medium">{item.changed_by_name}</span>
                          </div>
                          {item.notes && (
                            <div className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-600 rounded-lg p-2 mt-2 border border-gray-200 dark:border-slate-500">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Unified Complaint Management Card */}
      <div className="rounded-3xl bg-white border border-gray-200/60 shadow-xl overflow-hidden dark:bg-slate-800 dark:border-slate-700/60">
        
        {/* Main Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 px-8 py-6 relative overflow-hidden dark:from-slate-700 dark:via-slate-600 dark:to-slate-700">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 dark:from-blue-600/10 dark:to-indigo-600/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 dark:bg-white/10 dark:border-white/20">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Complaint Management</h1>
                  <p className="text-blue-50 text-sm mt-1 dark:text-slate-200">View and manage user complaints and feedback efficiently</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-white/90 text-xs font-medium dark:text-white/80">Total Cases</div>
                  <div className="text-2xl font-bold text-white">{pagination.total}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 rounded-2xl border border-red-200/60 bg-red-50 p-4 text-red-700 shadow-lg dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 dark:bg-red-900/40">
                <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="px-6 pt-6">
          <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200/60 p-5 dark:from-slate-700/50 dark:to-slate-700 dark:border-slate-600/60">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100">Filters & Search</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 dark:focus:border-blue-400 dark:focus:ring-blue-800"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 dark:focus:border-blue-400 dark:focus:ring-blue-800"
                >
                  <option value="">All Types</option>
                  <option value="complaint">Complaint</option>
                  <option value="feedback">Feedback</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="bug_report">Bug Report</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 dark:focus:border-blue-400 dark:focus:ring-blue-800"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Complaints List Section */}
        <div className="px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mb-6 h-14 w-14 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <p className="text-gray-600 font-semibold text-lg dark:text-gray-300">Loading complaints...</p>
              </div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="h-20 w-20 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-6">
                  <svg className="h-10 w-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">No complaints found</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or check back later</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {complaints.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="mt-8 flex items-center justify-between border-t border-gray-200/60 pt-6 dark:border-slate-700/60">
              <div className="text-sm text-gray-600 font-medium dark:text-gray-300">
                Showing <span className="font-semibold text-gray-900 dark:text-white">{pagination.offset + 1}</span> to <span className="font-semibold text-gray-900 dark:text-white">{Math.min(pagination.offset + pagination.limit, pagination.total)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{pagination.total}</span> results
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                  disabled={pagination.offset === 0}
                  className="group rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                  className="group rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                >
                  Next
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complaint Detail Modal */}
      <ComplaintDetail />
    </div>
  );
}

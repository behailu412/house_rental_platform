import React, { useEffect, useMemo, useState } from 'react';



import { getApiBase } from './api.js';

import { readStoredUser, writeStoredUser } from './authStorage.js';
import { useI18n } from './i18n.jsx';



import AdminComplaints from './admin_complaints.jsx';



import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';







const tabs = [



  { id: 'overview', label: 'Overview', icon: '📊' },



  { id: 'pending', label: 'Pending Listings', icon: '⏳' },



  { id: 'complaints', label: 'Complaints', icon: '⚠️' },



  { id: 'transactions', label: 'Transactions', icon: '💳' },



  { id: 'price_settings', label: 'Price Settings', icon: '💰' },



  { id: 'users', label: 'Users', icon: '👥' },



  { id: 'system_settings', label: 'System Settings', icon: '⚙️' },



];







const statusPill = (status) => {



  if (status === 'pending') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';



  if (status === 'active' || status === 'success') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';



  if (status === 'rejected' || status === 'failed') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';



  if (status === 'rented') return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300';



  return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200';



};







function StatCard({ title, value, tone = 'blue', darkMode = false }) {



  const toneMap = {



    blue: 'from-slate-500 to-slate-600',



    green: 'from-teal-500 to-teal-600',



    amber: 'from-stone-500 to-stone-600',



    purple: 'from-zinc-500 to-zinc-600',



    red: 'from-gray-600 to-gray-700',



    indigo: 'from-neutral-500 to-neutral-600',



  };



  const specialTones = {



    blue: 'from-slate-600 via-slate-500 to-gray-400',



    purple: 'from-zinc-600 via-zinc-500 to-stone-400',



    red: 'from-gray-600 via-gray-500 to-slate-400',



  };



  const isSpecial = tone === 'blue' || tone === 'purple' || tone === 'red';



  const iconMap = {



    blue: (



      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">



        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />



      </svg>



    ),



    purple: (



      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">



        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />



      </svg>



    ),



    red: (



      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">



        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />



        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />



      </svg>



    ),



  };



  return (



    <div className={`group relative overflow-hidden rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl ${
      darkMode 
        ? 'bg-slate-800 ring-2 ring-offset-2 ring-slate-700' 
        : 'bg-white' + (isSpecial ? ' ring-2 ring-offset-2 ring-' + tone + '-200' : '')
    }`}>



      {isSpecial && (



        <div className={`absolute inset-0 bg-gradient-to-br ${specialTones[tone]} opacity-5`} />



      )}



      <div className="relative">



        <div className="flex items-center justify-between mb-3">



          <p className={`text-sm font-medium uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{title}</p>



          {isSpecial && (



            <div className={`text-${tone}-500 opacity-60 group-hover:opacity-100 transition-opacity duration-300`}>



              {iconMap[tone]}



            </div>



          )}



        </div>



        <p className={`mt-2 text-3xl font-bold ${
          isSpecial 
            ? `bg-gradient-to-r ${toneMap[tone]} bg-clip-text text-transparent` 
            : darkMode ? 'text-slate-100' : 'text-gray-900'
        }`}>{value}</p>



        {isSpecial && (



          <div className={`mt-3 h-1 bg-gradient-to-r ${toneMap[tone]} rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-300`} />



        )}



      </div>



    </div>



  );



}







function PropertyDetailsModal({ selectedProperty, propertyDetails, loadingDetails, onClose, doAction }) {



  if (!selectedProperty) return null;



  return (



    <div className="property-details-modal fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">



      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white shadow-2xl border border-gray-100">



        {/* Enhanced Header */}



        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">



          <div className="flex items-center justify-between">



            <div>



              <h2 className="text-2xl font-bold drop-shadow-lg">Property Details</h2>



              <p className="text-blue-100 mt-1">Listing #{selectedProperty.id}</p>



            </div>



            <button 



              onClick={onClose} 



              className="group rounded-2xl bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-all hover:bg-white/30 hover:scale-105"



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



          {loadingDetails || !propertyDetails ? (



            <div className="flex items-center justify-center py-20">



              <div className="text-center">



                <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto"></div>



                <p className="text-lg text-gray-600 font-medium">Loading property details...</p>



              </div>



            </div>



          ) : (



            <div className="space-y-8">



              {/* Enhanced Photo Gallery */}



              {propertyDetails.photos?.length > 0 && (



                <div>



                  <h3 className="mb-6 text-xl font-bold text-gray-900 flex items-center gap-2">



                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />



                    </svg>



                    Property Photos



                  </h3>



                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">



                    {propertyDetails.photos.map((photo, index) => (



                      <div key={photo.id} className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">



                        <img 



                          src={photo.image_path} 



                          alt={`Property photo ${index + 1}`} 



                          className="h-64 w-full object-cover group-hover:scale-105 transition-transform duration-500" 



                        />



                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>



                      </div>



                    ))}



                  </div>



                </div>



              )}







              {/* Enhanced Property Info Cards */}



              <div className="grid gap-8 lg:grid-cols-2">



                {/* Property Information Card */}



                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-lg overflow-hidden">



                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">



                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">



                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />



                      </svg>



                      Property Information



                    </h3>



                  </div>



                  <div className="p-6 space-y-4">



                    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">



                      <span className="text-gray-600 font-medium">Type</span>



                      <span className="font-bold text-blue-700">{propertyDetails.property.property_type}</span>



                    </div>



                    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">



                      <span className="text-gray-600 font-medium">Price</span>



                      <span className="font-bold text-emerald-600 text-lg">{Number(propertyDetails.property.price).toFixed(2)} ETB</span>



                    </div>



                    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">



                      <span className="text-gray-600 font-medium">Views</span>



                      <span className="font-bold text-gray-900">{propertyDetails.property.views_count}</span>



                    </div>



                    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">



                      <span className="text-gray-600 font-medium">Status</span>



                      <span className={`rounded-full px-4 py-2 text-sm font-bold ${statusPill(propertyDetails.property.status)}`}>



                        {propertyDetails.property.status}



                      </span>



                    </div>



                  </div>



                </div>







                {/* Location & Owner Card */}



                <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 shadow-lg overflow-hidden">



                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">



                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">



                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />



                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />



                      </svg>



                      Location & Owner



                    </h3>



                  </div>



                  <div className="p-6 space-y-4">



                    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">



                      <span className="text-gray-600 font-medium">City</span>



                      <span className="font-bold text-purple-700">{propertyDetails.property.city}</span>



                    </div>



                    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">



                      <span className="text-gray-600 font-medium">Sub-city</span>



                      <span className="font-bold text-purple-700">{propertyDetails.property.subcity}</span>



                    </div>



                    <div className="p-3 bg-white rounded-xl shadow-sm">



                      <div className="flex items-start justify-between gap-3">



                        <span className="text-gray-600 font-medium">Address</span>



                        <span className="flex-1 text-right font-medium text-gray-700">{propertyDetails.property.real_address}</span>



                      </div>



                    </div>



                    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">



                      <span className="text-gray-600 font-medium">Owner</span>



                      <span className="font-bold text-purple-700">{propertyDetails.property.owner_full_name}</span>



                    </div>



                    <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">



                      <span className="text-gray-600 font-medium">Phone</span>



                      <span className="font-bold text-purple-700">{propertyDetails.property.owner_phone}</span>



                    </div>



                  </div>



                </div>



              </div>







              {/* Enhanced Descriptions Section */}



              {(propertyDetails.property.short_description || propertyDetails.property.description || propertyDetails.property.rules) && (



                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 shadow-lg overflow-hidden">



                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">



                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">



                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />



                      </svg>



                      Descriptions & Rules



                    </h3>



                  </div>



                  <div className="p-6 space-y-4">



                    {propertyDetails.property.short_description && (



                      <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-100">



                        <h4 className="font-semibold text-emerald-700 mb-2">Short Description</h4>



                        <p className="text-gray-700">{propertyDetails.property.short_description}</p>



                      </div>



                    )}



                    {propertyDetails.property.description && (



                      <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-100">



                        <h4 className="font-semibold text-emerald-700 mb-2">Full Description</h4>



                        <p className="text-gray-700 whitespace-pre-wrap">{propertyDetails.property.description}</p>



                      </div>



                    )}



                    {propertyDetails.property.rules && (



                      <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-100">



                        <h4 className="font-semibold text-emerald-700 mb-2">Property Rules</h4>



                        <p className="text-gray-700 whitespace-pre-wrap">{propertyDetails.property.rules}</p>



                      </div>



                    )}



                  </div>



                </div>



              )}







              {/* Enhanced Payment Section */}



              {propertyDetails.payment && (



                <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-lg overflow-hidden">



                  <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4">



                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">



                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />



                      </svg>



                      Payment Information



                    </h3>



                  </div>



                  <div className="p-6">



                    <div className="grid gap-4 md:grid-cols-2">



                      <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">



                        <span className="text-gray-600 font-medium block mb-1">Reference</span>



                        <span className="font-bold text-amber-700 text-lg">{propertyDetails.payment.tx_ref}</span>



                      </div>



                      <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">



                        <span className="text-gray-600 font-medium block mb-1">Amount</span>



                        <span className="font-bold text-emerald-600 text-lg">{propertyDetails.payment.amount} {propertyDetails.payment.currency}</span>



                      </div>



                      <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">



                        <span className="text-gray-600 font-medium block mb-1">Status</span>



                        <span className={`inline-block rounded-full px-4 py-2 text-sm font-bold ${statusPill(propertyDetails.payment.status)}`}>



                          {propertyDetails.payment.status}



                        </span>



                      </div>



                      <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">



                        <span className="text-gray-600 font-medium block mb-1">Date</span>



                        <span className="font-bold text-amber-700">{new Date(propertyDetails.payment.created_at).toLocaleString()}</span>



                      </div>



                    </div>



                  </div>



                </div>



              )}







              {/* Enhanced Action Buttons */}



              {propertyDetails.property.status === 'pending' && (



                <div className="flex flex-col sm:flex-row justify-end gap-4 border-t border-gray-200 pt-8">



                  <button



                    onClick={() => doAction('approve', selectedProperty.id, true)}



                    className="group rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-3 text-sm font-bold text-white transition-all hover:shadow-xl hover:scale-105 flex items-center gap-2"



                  >



                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />



                    </svg>



                    Approve Property



                  </button>



                  <button



                    onClick={() => doAction('reject', selectedProperty.id, true)}



                    className="group rounded-2xl bg-gradient-to-r from-red-600 to-red-700 px-8 py-3 text-sm font-bold text-white transition-all hover:shadow-xl hover:scale-105 flex items-center gap-2"



                  >



                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />



                    </svg>



                    Reject Property



                  </button>



                </div>



              )}



            </div>



          )}



        </div>



      </div>



    </div>



  );



}







function UserManagement({ users, loadingUsers, onToggleBan }) {
  const { t } = useI18n();



  const [searchTerm, setSearchTerm] = useState('');



  const [filterRole, setFilterRole] = useState('all');



  const [filterStatus, setFilterStatus] = useState('all');







  // Filter users based on search and filters



  const filteredUsers = useMemo(() => {



    return users.filter(user => {



      const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||



                           user.phone.toLowerCase().includes(searchTerm.toLowerCase());



      const matchesRole = filterRole === 'all' || user.role === filterRole;



      const matchesStatus = filterStatus === 'all' || 



                           (filterStatus === 'active' && !user.is_banned) ||



                           (filterStatus === 'banned' && user.is_banned);



      return matchesSearch && matchesRole && matchesStatus;



    });



  }, [users, searchTerm, filterRole, filterStatus]);







  // Calculate user statistics



  const userStats = useMemo(() => {



    const totalUsers = users.length;



    const activeUsers = users.filter(u => !u.is_banned).length;



    const bannedUsers = users.filter(u => u.is_banned).length;



    const owners = users.filter(u => u.role === 'owner').length;



    const renters = users.filter(u => u.role === 'renter').length;



    const admins = users.filter(u => u.role === 'admin').length;







    return { totalUsers, activeUsers, bannedUsers, owners, renters, admins };



  }, [users]);







  const getRoleColor = (role) => {



    switch (role) {



      case 'admin': return 'from-purple-500 to-purple-600';



      case 'owner': return 'from-blue-500 to-blue-600';



      case 'renter': return 'from-emerald-500 to-emerald-600';



      default: return 'from-gray-500 to-gray-600';



    }



  };







  const getRoleIcon = (role) => {



    switch (role) {



      case 'admin': return (



        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">



          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />



        </svg>



      );



      case 'owner': return (



        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">



          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />



        </svg>



      );



      case 'renter': return (



        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">



          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />



        </svg>



      );



      default: return null;



    }



  };







  return (



    <div className="users-tab space-y-6">



      {/* Enhanced Header with Stats */}



      <div className="rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">



        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-6">



          <div className="flex items-center justify-between mb-4">



            <div className="flex items-center gap-3">



              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">



                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />



                </svg>



              </div>



              <div>



                <h2 className="text-2xl font-bold text-white">{t('User Management')}</h2>



                <p className="text-indigo-100 text-sm">{t('Manage platform users and permissions')}</p>



              </div>



            </div>



          </div>







          {/* User Statistics Cards */}



          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">



            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">



              <div className="text-white/80 text-xs font-medium mb-1">Total Users</div>



              <div className="text-white text-xl font-bold">{userStats.totalUsers}</div>



            </div>



            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">



              <div className="text-white/80 text-xs font-medium mb-1">Active</div>



              <div className="text-white text-xl font-bold">{userStats.activeUsers}</div>



            </div>



            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">



              <div className="text-white/80 text-xs font-medium mb-1">Banned</div>



              <div className="text-white text-xl font-bold">{userStats.bannedUsers}</div>



            </div>



            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">



              <div className="text-white/80 text-xs font-medium mb-1">Owners</div>



              <div className="text-white text-xl font-bold">{userStats.owners}</div>



            </div>



            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">



              <div className="text-white/80 text-xs font-medium mb-1">Renters</div>



              <div className="text-white text-xl font-bold">{userStats.renters}</div>



            </div>



            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20">



              <div className="text-white/80 text-xs font-medium mb-1">Admins</div>



              <div className="text-white text-xl font-bold">{userStats.admins}</div>



            </div>



          </div>



        </div>



      </div>







      {/* Search and Filter Controls */}



      <div className="rounded-2xl bg-white shadow-lg p-6">



        <div className="flex flex-col lg:flex-row gap-4">



          <div className="flex-1">



            <div className="relative">



              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />



              </svg>



              <input



                type="text"



                placeholder="Search users by name or phone..."



                value={searchTerm}



                onChange={(e) => setSearchTerm(e.target.value)}



                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"



              />



            </div>



          </div>







          <div className="flex gap-3">



            <select



              value={filterRole}



              onChange={(e) => setFilterRole(e.target.value)}



              className="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"



            >



              <option value="all">All Roles</option>



              <option value="admin">Admin</option>



              <option value="owner">Owner</option>



              <option value="renter">Renter</option>



            </select>







            <select



              value={filterStatus}



              onChange={(e) => setFilterStatus(e.target.value)}



              className="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"



            >



              <option value="all">All Status</option>



              <option value="active">Active</option>



              <option value="banned">Banned</option>



            </select>



          </div>



        </div>



      </div>







      {/* Users Grid */}



      <div className="rounded-2xl bg-white shadow-lg p-6">



        {loadingUsers ? (



          <div className="flex items-center justify-center py-16">



            <div className="text-center">



              <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>



              <p className="text-lg text-gray-600 font-medium">Loading users...</p>



            </div>



          </div>



        ) : filteredUsers.length === 0 ? (



          <div className="rounded-xl bg-gradient-to-r from-gray-50 to-indigo-50 p-16 text-center border border-gray-200">



            <svg className="h-20 w-20 mx-auto text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">



              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />



            </svg>



            <p className="text-xl font-medium text-gray-600 mb-2">No users found</p>



            <p className="text-sm text-gray-500">Try adjusting your search or filters</p>



          </div>



        ) : (



          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-lg">



            <table className="w-full">



              <thead>



                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">



                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">User</th>



                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Contact</th>



                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Role</th>



                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Status</th>



                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700">Joined</th>



                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700">Action</th>



                </tr>



              </thead>



              <tbody className="divide-y divide-gray-100">



                {filteredUsers.map((user) => (



                  <tr key={user.id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 group">



                    <td className="px-4 py-4">



                      <div className="flex items-center gap-3">



                        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform`}>



                          {user.full_name.charAt(0).toUpperCase()}



                        </div>



                        <div>



                          <h3 className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">{user.full_name}</h3>



                        </div>



                      </div>



                    </td>



                    <td className="px-4 py-4">



                      <div className="flex items-center gap-2 text-sm text-gray-600">



                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />



                        </svg>



                        <span className="font-medium">{user.phone}</span>



                      </div>



                    </td>



                    <td className="px-4 py-4">



                      <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${getRoleColor(user.role)} px-3 py-1 text-xs font-semibold text-white shadow-md`}>



                        {getRoleIcon(user.role)}



                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}



                      </span>



                    </td>



                    <td className="px-4 py-4">



                      <div className="flex items-center gap-2">



                        <div className={`h-2 w-2 rounded-full ${user.is_banned ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`}></div>



                        <span className={`text-sm font-semibold ${user.is_banned ? 'text-red-600' : 'text-emerald-600'}`}>



                          {user.is_banned ? 'Banned' : 'Active'}



                        </span>



                      </div>



                    </td>



                    <td className="px-4 py-4 text-sm text-gray-600">



                      {new Date(user.created_at).toLocaleDateString()}



                    </td>



                    <td className="px-4 py-4 text-center">



                      <button
                        onClick={() => onToggleBan(user.id, user.is_banned)}
                        disabled={user.role === 'admin'}
                        title={user.role === 'admin' ? 'Admin users cannot be banned' : undefined}
                        className={`group/btn rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                          user.role === 'admin'
                            ? 'cursor-not-allowed bg-gray-300 text-gray-600 shadow-none'
                            : user.is_banned
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-md hover:shadow-lg hover:scale-105'
                              : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg hover:scale-105'
                        }`}



                      >



                        <span className="flex items-center gap-1">



                          {user.is_banned ? (



                            <>



                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />



                              </svg>



                              Unban



                            </>



                          ) : (



                            <>



                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />



                              </svg>



                              Ban



                            </>



                          )}



                        </span>



                      </button>



                    </td>



                  </tr>



                ))}



              </tbody>



            </table>



          </div>



        )}



      </div>



    </div>



  );



}







export default function AdminPanel() {
  const { t } = useI18n();



  const apiBase = useMemo(() => getApiBase(), []);



  const [pending, setPending] = useState([]);



  const [loading, setLoading] = useState(true);



  const [error, setError] = useState('');



  const [txns, setTxns] = useState([]);



  const [analytics, setAnalytics] = useState(null);



  const [revenueData, setRevenueData] = useState([]);



  const [trafficData, setTrafficData] = useState([]);



  const [activeTab, setActiveTab] = useState('overview');



  const [priceSettings, setPriceSettings] = useState([]);



  const [editingPrice, setEditingPrice] = useState(null);



  const [priceDrafts, setPriceDrafts] = useState({});



  const [users, setUsers] = useState([]);



  const [loadingUsers, setLoadingUsers] = useState(false);



  const [selectedProperty, setSelectedProperty] = useState(null);



  const [propertyDetails, setPropertyDetails] = useState(null);



  const [loadingDetails, setLoadingDetails] = useState(false);



  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const pendingCount = pending.length;
  const localizedTabs = useMemo(
    () => tabs.map((tab) => ({ ...tab, label: t(tab.label) })),
    [t]
  );

  const activeListingCount = Number(analytics?.overview?.active_properties ?? 0);

  const pendingListingCount = pending.length;

  const totalListingCount = activeListingCount + pendingListingCount;

  const [adminDarkMode, setAdminDarkMode] = useState(() => localStorage.getItem('hrp_admin_dark_mode') === '1');

  const [adminName, setAdminName] = useState(() => readStoredUser()?.full_name || '');

  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');

  const [adminNewPassword, setAdminNewPassword] = useState('');

  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');

  const [settingsLoading, setSettingsLoading] = useState(false);

  const [settingsSuccess, setSettingsSuccess] = useState('');

  const [systemSettings, setSystemSettings] = useState({

    auto_approve_pending_properties: false,

    admin_auto_refresh_seconds: 15,

  });







  const refresh = async ({ silent = false } = {}) => {

    if (!silent) {

      setLoading(true);

      setError('');

    }



    try {



      const pRes = await fetch(`${apiBase}/admin.php?action=pending_listings`, { credentials: 'include' });



      const pData = await pRes.json().catch(() => ({}));



      if (pData.ok) setPending(pData.items || []);







      const tRes = await fetch(`${apiBase}/admin.php?action=transactions`, { credentials: 'include' });



      const tData = await tRes.json().catch(() => ({}));



      if (tData.ok) setTxns(tData.items || []);







      const aRes = await fetch(`${apiBase}/admin.php?action=analytics`, { credentials: 'include' });



      const aData = await aRes.json().catch(() => ({}));



      if (aData.ok) setAnalytics(aData);







      const rRes = await fetch(`${apiBase}/admin.php?action=revenue_analytics&period=daily`, { credentials: 'include' });



      const rData = await rRes.json().catch(() => ({}));



      if (rData.ok) setRevenueData(rData.data || []);







      const trRes = await fetch(`${apiBase}/admin.php?action=traffic_analytics`, { credentials: 'include' });



      const trData = await trRes.json().catch(() => ({}));



      if (trData.ok) setTrafficData(trData);







      const psRes = await fetch(`${apiBase}/admin.php?action=price_settings`, { credentials: 'include' });



      const psData = await psRes.json().catch(() => ({}));



      if (psData.ok) {



        const items = psData.items || [];



        setPriceSettings(items);



        setPriceDrafts(



          items.reduce((acc, item) => {



            acc[item.property_type] = {



              listing_fee: String(item.listing_fee),



              currency: item.currency,



            };



            return acc;



          }, {})



        );



      }



      const ssRes = await fetch(`${apiBase}/admin.php?action=system_settings`, { credentials: 'include' });

      const ssData = await ssRes.json().catch(() => ({}));

      if (ssData.ok && ssData.settings) {

        setSystemSettings((prev) => ({

          ...prev,

          ...ssData.settings,

          admin_auto_refresh_seconds: Number(ssData.settings.admin_auto_refresh_seconds || prev.admin_auto_refresh_seconds || 15),

        }));

      }



    } catch {

      if (!silent) setError('Network error while loading admin data.');



    } finally {

      if (!silent) setLoading(false);



    }



  };







  const fetchUsers = async () => {



    setLoadingUsers(true);



    try {



      const res = await fetch(`${apiBase}/admin.php?action=users`, { credentials: 'include' });



      const data = await res.json().catch(() => ({}));



      if (data.ok) {



        setUsers(data.items || []);



      } else {



        setError(data.error || 'Failed to load users');



      }



    } catch {



      setError('Network error while loading users');



    } finally {



      setLoadingUsers(false);



    }



  };







  useEffect(() => {



    void refresh();



    void fetchUsers();



  }, []);



  useEffect(() => {

    const timer = setInterval(() => {

      void refresh({ silent: true });

    }, Math.max(5000, Number(systemSettings.admin_auto_refresh_seconds || 15) * 1000));

    return () => clearInterval(timer);

  }, [systemSettings.admin_auto_refresh_seconds]);



  useEffect(() => {

    if (adminDarkMode) {

      document.documentElement.classList.add('dark');

      localStorage.setItem('hrp_admin_dark_mode', '1');

    } else {

      document.documentElement.classList.remove('dark');

      localStorage.setItem('hrp_admin_dark_mode', '0');

    }

  }, [adminDarkMode]);







  const closeDetailsModal = () => {



    setSelectedProperty(null);



    setPropertyDetails(null);



  };







  const doAction = async (action, propertyId, closeModalAfter = false) => {



    try {



      const res = await fetch(`${apiBase}/admin.php?action=${encodeURIComponent(action)}`, {



        method: 'POST',



        headers: { 'Content-Type': 'application/json' },



        credentials: 'include',



        body: JSON.stringify({ property_id: propertyId }),



      });



      const data = await res.json().catch(() => ({}));



      if (!res.ok || data.ok !== true) throw new Error(data.error || 'Failed');



      await refresh();



      if (closeModalAfter) closeDetailsModal();



    } catch (e) {



      setError(e?.message || 'Action failed');



    }



  };







  const fetchPropertyDetails = async (propertyId) => {



    setLoadingDetails(true);



    setError('');



    try {



      const res = await fetch(`${apiBase}/admin.php?action=property_details&property_id=${propertyId}`, {



        credentials: 'include',



      });



      const data = await res.json().catch(() => ({}));



      if (!res.ok || data.ok !== true) throw new Error(data.error || 'Failed to fetch property details');



      setPropertyDetails(data);



    } catch (e) {



      setError(e?.message || 'Failed to fetch property details');



    } finally {



      setLoadingDetails(false);



    }



  };







  const handlePropertyClick = (property) => {



    setSelectedProperty(property);



    void fetchPropertyDetails(property.id);



  };



  useEffect(() => {

    setMobileSidebarOpen(false);

  }, [activeTab]);







  const toggleBan = async (userId, isBanned) => {
    const targetUser = users.find((user) => user.id === userId);
    if (targetUser?.role === 'admin') {
      setError('Admin users cannot be banned');
      return;
    }

    try {



      const res = await fetch(`${apiBase}/admin.php?action=ban_user`, {



        method: 'POST',



        headers: { 'Content-Type': 'application/json' },



        credentials: 'include',



        body: JSON.stringify({ user_id: userId, ban: !isBanned }),



      });



      const data = await res.json().catch(() => ({}));



      if (!res.ok || data.ok !== true) throw new Error(data.error || 'Failed to update user status');



      await fetchUsers();



    } catch (e) {



      setError(e?.message || 'Network error while updating user status');



    }



  };







  const updatePriceSetting = async (propertyType) => {



    try {



      const draft = priceDrafts[propertyType];



      const listing_fee = Number.parseFloat(draft?.listing_fee);



      const currency = draft?.currency?.trim();



      if (Number.isNaN(listing_fee) || listing_fee <= 0 || listing_fee > 100 || !currency) {

        setError('Please provide a valid percentage (0-100) and currency.');



        return;



      }







      const res = await fetch(`${apiBase}/admin.php?action=update_price_settings`, {



        method: 'POST',



        headers: { 'Content-Type': 'application/json' },



        credentials: 'include',



        body: JSON.stringify({ property_type: propertyType, listing_fee, currency }),



      });



      const data = await res.json().catch(() => ({}));



      if (!res.ok || data.ok !== true) throw new Error(data.error || 'Failed to update price settings');



      setEditingPrice(null);



      await refresh();



    } catch (e) {



      setError(e?.message || 'Network error while updating price settings');



    }



  };



  const saveSystemSettings = async () => {

    setError('');

    setSettingsSuccess('');

    setSettingsLoading(true);

    try {

      const payload = {

        auto_approve_pending_properties: !!systemSettings.auto_approve_pending_properties,

        admin_auto_refresh_seconds: Number(systemSettings.admin_auto_refresh_seconds || 15),

      };

      const res = await fetch(`${apiBase}/admin.php?action=update_system_settings`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        credentials: 'include',

        body: JSON.stringify(payload),

      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.ok !== true) throw new Error(data.error || 'Failed to save system settings');

      setSettingsSuccess('System settings saved successfully.');

      await refresh({ silent: true });

    } catch (e) {

      setError(e?.message || 'Failed to save system settings');

    } finally {

      setSettingsLoading(false);

    }

  };



  const saveAdminAccount = async () => {

    setError('');

    setSettingsSuccess('');

    const trimmedName = adminName.trim();

    if (trimmedName.length < 2) {

      setError('Full name must be at least 2 characters.');

      return;

    }



    const wantsPassword = adminCurrentPassword || adminNewPassword || adminConfirmPassword;

    if (wantsPassword) {

      if (!adminCurrentPassword || !adminNewPassword || !adminConfirmPassword) {

        setError('Please complete all password fields.');

        return;

      }

      if (adminNewPassword.length < 6) {

        setError('New password must be at least 6 characters.');

        return;

      }

      if (adminNewPassword !== adminConfirmPassword) {

        setError('New password and confirmation do not match.');

        return;

      }

    }



    setSettingsLoading(true);

    try {

      const profileRes = await fetch(`${apiBase}/me.php?action=update_profile`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        credentials: 'include',

        body: JSON.stringify({ full_name: trimmedName }),

      });

      const profileData = await profileRes.json().catch(() => ({}));

      if (!profileRes.ok || profileData.ok !== true) throw new Error(profileData.error || 'Failed to update profile');

      if (profileData.user) writeStoredUser(profileData.user);



      if (wantsPassword) {

        const passRes = await fetch(`${apiBase}/me.php?action=change_password`, {

          method: 'POST',

          headers: { 'Content-Type': 'application/json' },

          credentials: 'include',

          body: JSON.stringify({

            current_password: adminCurrentPassword,

            new_password: adminNewPassword,

          }),

        });

        const passData = await passRes.json().catch(() => ({}));

        if (!passRes.ok || passData.ok !== true) throw new Error(passData.error || 'Failed to change password');

      }



      setAdminCurrentPassword('');

      setAdminNewPassword('');

      setAdminConfirmPassword('');

      setSettingsSuccess(wantsPassword ? 'Profile and password updated successfully.' : 'Profile updated successfully.');

    } catch (e) {

      setError(e?.message || 'Failed to update admin account');

    } finally {

      setSettingsLoading(false);

    }

  };







  const renderContent = () => {



    if (activeTab === 'overview') {



      return (



        <div className="space-y-8">



          {/* Enhanced Stats Grid */}



          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">



            <StatCard title="Total Users" value={analytics?.overview?.total_users ?? 0} tone="blue" darkMode={adminDarkMode} />



            <StatCard title="Total Revenue" value={`${analytics?.overview?.total_revenue ?? 0} ETB`} tone="purple" darkMode={adminDarkMode} />



            <StatCard title="Total Views" value={analytics?.overview?.total_views ?? 0} tone="red" darkMode={adminDarkMode} />



          </div>







          {/* Property Statistics Pie Chart */}

          <div className={`rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
            adminDarkMode ? 'bg-slate-800' : 'bg-white'
          }`}>

            <div className="bg-gradient-to-r from-slate-500 to-slate-600 px-6 py-4">

              <h3 className="text-lg font-semibold text-white flex items-center gap-2">

                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />

                </svg>

                {t('Property Statistics Overview')}

              </h3>

            </div>

            <div className="p-6">

              <div className="flex flex-col lg:flex-row items-center justify-center gap-8">

                {/* Pie Chart Container */}

                <div className="w-full max-w-md lg:max-w-lg">

                  <div className="aspect-square w-full max-w-[400px] mx-auto">

                    <ResponsiveContainer width="100%" height="100%">

                      <PieChart>

                        <Pie
                          data={[
                            { name: 'Active Listings', value: activeListingCount, color: '#64748B' },
                            { name: 'Pending Listings', value: pendingListingCount, color: '#6B7280' },
                          ].filter(item => item.value > 0)}

                          cx="50%"

                          cy="50%"

                          labelLine={false}

                          label={({ percent }) => `${(percent * 100).toFixed(1)}%`}

                          outerRadius={120}

                          innerRadius={40}

                          fill="#8884d8"

                          dataKey="value"

                        >

                          {[
                            { name: 'Active Listings', color: '#64748B' },
                            { name: 'Pending Listings', color: '#6B7280' },
                          ].map((entry, index) => (

                            <Cell key={`cell-${index}`} fill={entry.color} />

                          ))}

                        </Pie>

                        <Tooltip 

                          formatter={(value, name) => [`${value} properties`, name]}

                          contentStyle={{ 

                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 

                            border: '1px solid #e5e7eb',

                            borderRadius: '12px',

                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',

                            fontSize: '14px'

                          }}

                        />

                      </PieChart>

                    </ResponsiveContainer>

                  </div>

                </div>

                {/* Vertical Indicators */}

                <div className="flex flex-col gap-4 w-full lg:w-auto">

                  <div className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border hover:shadow-xl transition-shadow ${
                    adminDarkMode 
                      ? 'bg-slate-700 border-slate-600' 
                      : 'bg-white border-gray-100'
                  }`}>
                    <div className="w-4 h-4 rounded-full bg-slate-600 shadow-md flex-shrink-0"></div>

                    <div>

                      <div className={`text-2xl font-bold ${adminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{activeListingCount}</div>

                      <div className={`text-sm ${adminDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Active</div>

                    </div>

                  </div>

                  <div className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border hover:shadow-xl transition-shadow ${
                    adminDarkMode 
                      ? 'bg-slate-700 border-slate-600' 
                      : 'bg-white border-gray-100'
                  }`}>
                    <div className="w-4 h-4 rounded-full bg-gray-600 shadow-md flex-shrink-0"></div>

                    <div>

                      <div className={`text-2xl font-bold ${adminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{pendingListingCount}</div>

                      <div className={`text-sm ${adminDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Pending</div>

                    </div>

                  </div>

                  <div className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border hover:shadow-xl transition-shadow ${
                    adminDarkMode 
                      ? 'bg-slate-700 border-slate-600' 
                      : 'bg-white border-gray-100'
                  }`}>
                    <div className="w-4 h-4 rounded-full bg-zinc-600 shadow-md flex-shrink-0"></div>

                    <div>

                      <div className={`text-2xl font-bold ${adminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{totalListingCount}</div>

                      <div className={`text-sm ${adminDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Total</div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>







          {/* Enhanced Analytics Cards */}



          <div className="grid gap-6 lg:grid-cols-3">



            {/* Popular Cities */}



            <div className={`group rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
              adminDarkMode ? 'bg-slate-800' : 'bg-white'
            }`}>



              <div className="bg-gradient-to-r from-slate-500 to-slate-600 px-6 py-4">



                <h3 className="text-lg font-semibold text-white flex items-center gap-2">



                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />



                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />



                  </svg>



                  Popular Cities



                </h3>



              </div>



              <div className="p-6">

                <div className="max-h-64 overflow-y-auto space-y-3 pr-2">

                  {(analytics?.popular_cities || []).map((city, i) => (

                    <div key={city.city} className={`group/item flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 ${
                      adminDarkMode 
                        ? 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700' 
                        : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-slate-50 hover:to-slate-100'
                    }`}>

                      <div className="flex items-center gap-3">

                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-600 text-xs font-bold text-white shadow-md group-hover/item:scale-110 transition-transform">{i + 1}</span>

                        <span className="font-medium group-hover/item:transition-colors ${
                          adminDarkMode ? 'text-slate-200 group-hover/item:text-slate-100' : 'text-gray-800 group-hover/item:text-slate-700'
                        }">{city.city}</span>

                      </div>

                      <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                        adminDarkMode ? 'text-slate-300 bg-slate-700' : 'text-slate-600 bg-slate-50'
                      }`}>{city.property_count} listings</span>

                    </div>

                  ))}

                </div>

              </div>



            </div>







            {/* Recent Signups */}



            <div className={`group rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
              adminDarkMode ? 'bg-slate-800' : 'bg-white'
            }`}>



              <div className="bg-gradient-to-r from-stone-500 to-stone-600 px-6 py-4">



                <h3 className="text-lg font-semibold text-white flex items-center gap-2">



                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />



                  </svg>



                  Recent Signups



                </h3>



              </div>



              <div className="p-6">

                <div className="max-h-64 overflow-y-auto space-y-3 pr-2">

                  {(analytics?.recent_signups || []).map((item, i) => (

                    <div key={`${item.full_name}-${i}`} className={`group/item rounded-xl border p-4 hover:shadow-md transition-all duration-200 ${
                      adminDarkMode 
                        ? 'bg-gradient-to-r from-slate-700 to-slate-800 border-slate-600 hover:border-stone-500' 
                        : 'bg-gradient-to-r from-white to-stone-50/30 border-gray-200 hover:border-stone-300'
                    }`}>

                      <div className="flex items-center justify-between">

                        <div>

                          <p className={`font-semibold group-hover/item:transition-colors ${
                            adminDarkMode ? 'text-slate-100 group-hover/item:text-stone-200' : 'text-gray-900 group-hover/item:text-stone-700'
                          }`}>{item.full_name}</p>

                          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">

                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              adminDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-100 text-gray-700'
                            }`}>{item.role}</span>

                            <span className={adminDarkMode ? 'text-slate-400' : 'text-gray-500'}>{new Date(item.created_at).toLocaleDateString()}</span>

                          </div>

                        </div>

                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md bg-gradient-to-br ${
                          adminDarkMode ? 'from-stone-500 to-stone-700' : 'from-stone-400 to-stone-600'
                        }`}>

                          {item.full_name.charAt(0).toUpperCase()}

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              </div>



            </div>







            {/* Recent Properties */}



            <div className={`group rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
              adminDarkMode ? 'bg-slate-800' : 'bg-white'
            }`}>



              <div className="bg-gradient-to-r from-zinc-500 to-zinc-600 px-6 py-4">



                <h3 className="text-lg font-semibold text-white flex items-center gap-2">



                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />



                  </svg>



                  Recent Properties



                </h3>



              </div>



              <div className="p-6">

                <div className="max-h-64 overflow-y-auto space-y-3 pr-2">

                  {(analytics?.recent_properties || []).map((item, i) => (

                    <div key={`${item.owner}-${i}`} className={`group/item rounded-xl border p-4 hover:shadow-md transition-all duration-200 ${
                      adminDarkMode 
                        ? 'bg-gradient-to-r from-slate-700 to-slate-800 border-slate-600 hover:border-zinc-500' 
                        : 'bg-gradient-to-r from-white to-zinc-50/30 border-gray-200 hover:border-zinc-300'
                    }`}>

                      <div className="flex items-center justify-between">

                        <div>

                          <p className={`font-semibold group-hover/item:transition-colors ${
                            adminDarkMode ? 'text-slate-100 group-hover/item:text-zinc-200' : 'text-gray-900 group-hover/item:text-zinc-700'
                          }`}>{item.city} - {item.subcity}</p>

                          <div className={`mt-1 flex items-center gap-2 text-sm ${adminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            <span className={`text-xs ${adminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>by {item.owner}</span>

                            <span className={adminDarkMode ? 'text-slate-400' : 'text-gray-500'}>{new Date(item.created_at).toLocaleDateString()}</span>

                          </div>

                        </div>

                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md bg-gradient-to-br ${
                          adminDarkMode ? 'from-zinc-500 to-zinc-700' : 'from-zinc-400 to-zinc-600'
                        }`}>

                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />

                          </svg>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              </div>



            </div>



          </div>







          

        </div>



      );



    }







    if (activeTab === 'pending') {



      return (



        <div className="pending-tab rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">



          <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4">



            <div className="flex items-center justify-between">



              <h2 className="text-xl font-semibold text-white flex items-center gap-2">



                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />



                </svg>



                {t('Pending Listings')}



              </h2>



            </div>



          </div>



          <div className="p-6">



            {loading ? (



              <div className="flex items-center justify-center py-16">



                <div className="text-center">



                  <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600 mx-auto"></div>



                  <p className="text-gray-500 font-medium">Loading pending listings...</p>



                </div>



              </div>



            ) : pending.length === 0 ? (



              <div className="rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 p-12 text-center text-gray-500 border border-gray-200">



                <svg className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />



                </svg>



                <p className="text-lg font-medium text-gray-600">No pending properties</p>



                <p className="text-sm text-gray-500 mt-1">All properties have been reviewed</p>



              </div>



            ) : (



              <div className="space-y-4">



                {pending.map((p) => (



                  <article



                    key={p.id}



                    onClick={() => handlePropertyClick(p)}



                    className="group cursor-pointer rounded-2xl border border-gray-200 bg-gradient-to-r from-white to-slate-50/30 p-5 transition-all duration-300 hover:shadow-xl hover:border-slate-300 hover:scale-[1.02]"



                  >



                    <div className="flex gap-4">



                      <div className="h-28 w-36 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 shadow-md group-hover:shadow-lg transition-shadow">



                        {p.cover_photo ? <img src={p.cover_photo} alt="cover" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" /> : (



                          <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">



                            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />



                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />



                            </svg>



                          </div>



                        )}



                      </div>



                      <div className="min-w-0 flex-1">



                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">



                          <div className="flex-1">



                            <div className="flex items-center gap-2 mb-1">



                              <p className="text-lg font-bold text-gray-900 group-hover:text-slate-600 transition-colors">{p.city} - {p.subcity}</p>



                              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>



                            </div>



                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{p.real_address}</p>



                            <div className="flex items-center gap-4 text-sm text-gray-500">



                              <span className="flex items-center gap-1">



                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />



                                </svg>



                                {p.owner_full_name}



                              </span>



                              <span className="flex items-center gap-1">



                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />



                                </svg>



                                {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Date not available'}



                              </span>



                            </div>



                          </div>



                          <div className="text-left sm:text-right">



                            <p className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">{Number(p.price).toFixed(0)} ETB</p>



                            <p className="text-xs text-gray-500 mt-1">Property #{p.id}</p>



                          </div>



                        </div>



                        <div className="mt-4 flex flex-wrap justify-end gap-3">



                          <button



                            onClick={(e) => {



                              e.stopPropagation();



                              void doAction('approve', p.id);



                            }}



                            className="group/btn rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:scale-105 border border-emerald-500/20"



                          >



                            <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />



                            </svg>



                            Approve



                          </button>



                          <button



                            onClick={(e) => {



                              e.stopPropagation();



                              void doAction('reject', p.id);



                            }}



                            className="group/btn rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:scale-105 border border-red-500/20"



                          >



                            <svg className="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />



                            </svg>



                            Reject



                          </button>



                        </div>



                      </div>



                    </div>



                  </article>



                ))}



              </div>



            )}



          </div>



        </div>



      );



    }







    if (activeTab === 'transactions') {



      return (



        <div className={`rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
          adminDarkMode ? 'bg-slate-800' : 'bg-white'
        }`}>



          <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4">



            <div className="flex items-center justify-between">



              <h2 className="text-xl font-semibold text-white flex items-center gap-2">



                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />



                </svg>



                {t('Transaction History')}



              </h2>



            </div>



          </div>



          <div className="p-6">



            <div className="overflow-x-auto">



              <table className="min-w-full">



                <thead>



                  <tr className={`border-b ${
                    adminDarkMode ? 'border-slate-700 bg-slate-700/50' : 'border-gray-200 bg-gray-50'
                  }`}>



                    <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                      adminDarkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>Reference</th>



                    <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                      adminDarkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>Property</th>



                    <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                      adminDarkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>User</th>



                    <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                      adminDarkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>Amount</th>



                    <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                      adminDarkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>Status</th>



                    <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${
                      adminDarkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>Date</th>



                  </tr>



                </thead>



                <tbody className={`divide-y ${
                  adminDarkMode ? 'divide-slate-700' : 'divide-gray-100'
                }`}>



                  {txns.length === 0 ? (



                    <tr>



                      <td colSpan="6" className="px-6 py-16">



                        <div className="text-center">



                          <svg className={`h-16 w-16 mx-auto mb-4 ${
                            adminDarkMode ? 'text-slate-500' : 'text-gray-400'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">



                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />



                          </svg>



                          <p className={`text-lg font-medium ${
                            adminDarkMode ? 'text-slate-400' : 'text-gray-600'
                          }`}>No transactions yet</p>



                          <p className={`text-sm mt-1 ${
                            adminDarkMode ? 'text-slate-500' : 'text-gray-500'
                          }`}>Transaction history will appear here</p>



                        </div>



                      </td>



                    </tr>



                  ) : (



                    txns.slice(0, 50).map((t) => (



                      <tr key={t.id} className={`transition-all duration-200 group ${
                        adminDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'
                      }`}>



                        <td className="px-6 py-4">



                          <div className="flex items-center gap-2">



                            <div className="h-8 w-8 rounded-lg bg-slate-600 flex items-center justify-center text-white text-xs font-bold shadow-md">



                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />



                              </svg>



                            </div>



                            <span className={`text-sm font-mono font-semibold px-2 py-1 rounded ${
                              adminDarkMode ? 'text-slate-300 bg-slate-700' : 'text-gray-700 bg-gray-100'
                            }`}>{t.tx_ref}</span>



                          </div>



                        </td>



                        <td className="px-6 py-4">



                          <span className={`inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg border ${
                            adminDarkMode ? 'text-slate-300 bg-slate-700 border-slate-600' : 'text-gray-900 bg-gray-50 border-gray-200'
                          }`}>



                            <svg className={`h-4 w-4 ${
                              adminDarkMode ? 'text-slate-400' : 'text-gray-500'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">



                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />



                            </svg>



                            #{t.property_id}



                          </span>



                        </td>



                        <td className="px-6 py-4">



                          <div className="flex items-center gap-3">



                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ${
                              adminDarkMode ? 'bg-slate-600' : 'bg-gray-500'
                            }`}>



                              {t.full_name.charAt(0).toUpperCase()}



                            </div>



                            <span className={`text-sm font-medium ${
                              adminDarkMode ? 'text-slate-300' : 'text-gray-900'
                            }`}>{t.full_name}</span>



                          </div>



                        </td>



                        <td className="px-6 py-4">



                          <span className={`inline-flex items-center gap-1 text-lg font-bold ${
                            adminDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}>



                            {t.amount} {t.currency}



                          </span>



                        </td>



                        <td className="px-6 py-4">



                          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold border ${statusPill(t.status)}`}>



                            {t.status}



                          </span>



                        </td>



                        <td className="px-6 py-4">



                          <div className={`flex items-center gap-2 text-sm ${
                            adminDarkMode ? 'text-slate-400' : 'text-gray-500'
                          }`}>



                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />



                            </svg>



                            {t.created_at}



                          </div>



                        </td>



                      </tr>



                    ))



                  )}



                </tbody>



              </table>



            </div>



          </div>



        </div>



      );



    }







    if (activeTab === 'price_settings') {

      return (

        <div className={`rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
          adminDarkMode ? 'bg-slate-800' : 'bg-white'
        }`}>



          <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4">



            <div className="flex items-center justify-between">



              <h2 className="text-xl font-semibold text-white flex items-center gap-2">



                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />



                </svg>



                {t('Price Settings (% Based)')}



              </h2>



            </div>



          </div>



          <div className="p-6">



            <div className="space-y-4">



              {priceSettings.map((setting) => {



                const draft = priceDrafts[setting.property_type] || { listing_fee: '', currency: '' };



                const editing = editingPrice === setting.property_type;



                return (



                  <div key={setting.property_type} className={`rounded-xl border p-5 hover:shadow-md transition-shadow ${
                    adminDarkMode ? 'border-slate-600 bg-slate-700/50' : 'border-gray-200'
                  }`}>



                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">



                      <div>



                        <p className={`font-semibold text-lg ${adminDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{setting.property_type}</p>



                        <p className={`text-sm mt-1 ${adminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Fee percentage for {setting.property_type.toLowerCase()} properties</p>



                      </div>



                      {editing ? (



                        <div className="flex flex-wrap items-center gap-2">



                          <input



                            type="number"



                            min="0"



                            step="0.01"



                            value={draft.listing_fee}



                            onChange={(e) =>



                              setPriceDrafts((prev) => ({



                                ...prev,



                                [setting.property_type]: { ...prev[setting.property_type], listing_fee: e.target.value },



                              }))



                            }



                            className={`w-28 rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                              adminDarkMode 
                                ? 'border-slate-500 bg-slate-600 text-slate-100 focus:border-blue-400' 
                                : 'border-gray-300 focus:border-blue-500'
                            }`}



                          />

                          <span className={`text-sm font-semibold ${adminDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>%</span>



                          <input



                            type="text"



                            value={draft.currency}



                            onChange={(e) =>



                              setPriceDrafts((prev) => ({



                                ...prev,



                                [setting.property_type]: { ...prev[setting.property_type], currency: e.target.value.toUpperCase() },



                              }))



                            }



                            className={`w-20 rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                              adminDarkMode 
                                ? 'border-slate-500 bg-slate-600 text-slate-100 focus:border-blue-400' 
                                : 'border-gray-300 focus:border-blue-500'
                            }`}



                          />



                          <button onClick={() => void updatePriceSetting(setting.property_type)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700">Save</button>



                          <button onClick={() => setEditingPrice(null)} className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                            adminDarkMode 
                              ? 'border-slate-500 text-slate-300 hover:bg-slate-600' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}>Cancel</button>



                        </div>



                      ) : (



                        <div className="flex items-center gap-3">



                          <span className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                            adminDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'
                          }`}>{setting.listing_fee}% ({setting.currency})</span>



                          <button onClick={() => setEditingPrice(setting.property_type)} className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-700">Edit</button>



                        </div>



                      )}



                    </div>



                  </div>



                );



              })}



            </div>



          </div>



        </div>



      );



    }







    if (activeTab === 'complaints') {



      return (
        <div className="complaints-tab">
          <AdminComplaints embedded />
        </div>
      );



    }



    if (activeTab === 'system_settings') {

      return (

        <div className="space-y-6">

          <div className="rounded-2xl bg-white shadow-lg overflow-hidden">

            <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-4 text-white">

              <h2 className="text-xl font-semibold">{t('System Settings')}</h2>

              <p className="text-sm text-slate-200 mt-1">{t('Configure global admin controls and account preferences.')}</p>

            </div>

            <div className="p-6 grid gap-4">

              <div className="rounded-xl border border-gray-200 p-4">

                <div className="flex items-center justify-between gap-4">

                  <div>

                    <h3 className="font-semibold text-gray-900">Dark Mode</h3>

                    <p className="text-sm text-gray-600">Switch admin interface appearance.</p>

                  </div>

                  <button

                    type="button"

                    onClick={() => setAdminDarkMode((v) => !v)}

                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${adminDarkMode ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 text-white'}`}

                  >

                    {adminDarkMode ? 'Light Mode' : 'Dark Mode'}

                  </button>

                </div>

              </div>



              <div className="rounded-xl border border-gray-200 p-4 space-y-4">

                <div className="flex items-center justify-between gap-4">

                  <div>

                    <h3 className="font-semibold text-gray-900">Auto-Approve Pending Properties</h3>

                    <p className="text-sm text-gray-600">Automatically publish paid pending listings without manual approval.</p>

                  </div>

                  <button

                    type="button"

                    onClick={() =>

                      setSystemSettings((prev) => ({

                        ...prev,

                        auto_approve_pending_properties: !prev.auto_approve_pending_properties,

                      }))

                    }

                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${

                      systemSettings.auto_approve_pending_properties

                        ? 'bg-emerald-600 text-white'

                        : 'bg-gray-200 text-gray-700'

                    }`}

                  >

                    {systemSettings.auto_approve_pending_properties ? 'Enabled' : 'Disabled'}

                  </button>

                </div>



                <div>

                  <label className="mb-1 block text-sm font-medium text-gray-700">Admin Auto-Refresh Interval (seconds)</label>

                  <input

                    type="number"

                    min={5}

                    max={300}

                    value={systemSettings.admin_auto_refresh_seconds}

                    onChange={(e) =>

                      setSystemSettings((prev) => ({

                        ...prev,

                        admin_auto_refresh_seconds: Number(e.target.value || 15),

                      }))

                    }

                    className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm"

                  />

                </div>



                <button

                  type="button"

                  onClick={() => void saveSystemSettings()}

                  disabled={settingsLoading}

                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"

                >

                  {settingsLoading ? 'Saving...' : 'Save System Settings'}

                </button>

              </div>



              <div className="rounded-xl border border-gray-200 p-4 space-y-3">

                <h3 className="font-semibold text-gray-900">Admin Account Security</h3>

                <div>

                  <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>

                  <input

                    value={adminName}

                    onChange={(e) => setAdminName(e.target.value)}

                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"

                  />

                </div>

                <div className="grid gap-3 sm:grid-cols-3">

                  <input

                    type="password"

                    placeholder="Current password"

                    value={adminCurrentPassword}

                    onChange={(e) => setAdminCurrentPassword(e.target.value)}

                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"

                  />

                  <input

                    type="password"

                    placeholder="New password"

                    value={adminNewPassword}

                    onChange={(e) => setAdminNewPassword(e.target.value)}

                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"

                  />

                  <input

                    type="password"

                    placeholder="Confirm new password"

                    value={adminConfirmPassword}

                    onChange={(e) => setAdminConfirmPassword(e.target.value)}

                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"

                  />

                </div>

                <button

                  type="button"

                  onClick={() => void saveAdminAccount()}

                  disabled={settingsLoading}

                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"

                >

                  {settingsLoading ? 'Saving...' : 'Save Account Changes'}

                </button>

              </div>

            </div>

          </div>

        </div>

      );

    }







    if (activeTab === 'users') {



      return <UserManagement users={users} loadingUsers={loadingUsers} onToggleBan={toggleBan} />;



    }







    return null;



  };







  return (



    <div className={`admin-console flex min-h-screen ${adminDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-slate-50 to-gray-100'}`}>



      {/* Modern Sidebar */}



      {mobileSidebarOpen ? (

        <button

          type="button"

          aria-label="Close sidebar overlay"

          onClick={() => setMobileSidebarOpen(false)}

          className="fixed inset-0 z-30 bg-black/40 md:hidden"

        />

      ) : null}

      <aside className={`fixed left-0 top-0 z-40 h-full border-r shadow-xl transition-all duration-300 ease-in-out ${adminDarkMode ? 'bg-slate-900 border-slate-700/80' : 'bg-slate-50 border-slate-200'} ${sidebarCollapsed ? 'w-16 md:w-16' : 'w-72'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>



        <div className="flex h-full flex-col">



          {/* Enhanced Logo Area */}



          <div className={`flex h-16 items-center justify-between border-b px-4 ${adminDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>



            {!sidebarCollapsed && (



              <div className="flex items-center gap-3">



                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${adminDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-slate-100 border-slate-200'}`}>



                  <svg className={`h-6 w-6 ${adminDarkMode ? 'text-slate-100' : 'text-slate-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">



                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />



                  </svg>



                </div>



                <div>



                  <span className={`font-bold text-lg ${adminDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Admin</span>



                  <p className={`text-xs ${adminDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Control Panel</p>



                </div>



              </div>



            )}



            <button

              onClick={() => {

                if (window.innerWidth < 768) {

                  setMobileSidebarOpen(false);

                  return;

                }

                setSidebarCollapsed((prev) => !prev);

              }}



              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`rounded-lg p-2 transition-all duration-200 ${adminDarkMode ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}



            >



              <svg className="h-5 w-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarCollapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'} />



              </svg>



            </button>



          </div>







          {/* Enhanced Navigation */}



          <nav className={`flex-1 overflow-y-auto py-6 ${adminDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>



            <div className="space-y-2 px-3">



              {localizedTabs.map((tab) => (



                <button



                  key={tab.id}



                  onClick={() => setActiveTab(tab.id)}



                  className={`w-full group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative ${



                    activeTab === tab.id



                      ? (adminDarkMode
                        ? 'bg-slate-800 text-blue-300 shadow border border-slate-600'
                        : 'bg-white text-blue-700 shadow-sm border border-blue-200')



                      : (adminDarkMode
                        ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900')



                  }`}



                >



                  {activeTab === tab.id && (



                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${adminDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`} />



                  )}



                  <span className={`text-xl transition-all duration-200 ${activeTab === tab.id ? 'scale-110' : 'scale-100'}`}>{tab.icon}</span>



                  {!sidebarCollapsed && (

                    <>

                      <span className="font-medium">{tab.label}</span>

                      {tab.id === 'pending' && pendingCount > 0 ? (

                        <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">

                          {pendingCount > 99 ? '99+' : pendingCount}

                        </span>

                      ) : null}

                    </>



                  )}



                </button>



              ))}



            </div>



          </nav>







          {/* Enhanced Footer */}



          <div className={`border-t p-4 ${adminDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>



            {!sidebarCollapsed ? (



              <div className={`flex items-center gap-3 rounded-xl p-3 border ${adminDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>



                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${adminDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}>



                  <span className="text-white text-sm font-bold">AD</span>



                </div>



                <div className="flex-1 min-w-0">



                  <p className={`text-sm font-semibold truncate ${adminDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Admin User</p>



                  <p className={`text-xs truncate ${adminDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>System Administrator</p>



                </div>



              </div>



            ) : (



              <div className="flex justify-center">



                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${adminDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}>



                  <span className="text-white text-sm font-bold">AD</span>



                </div>



              </div>



            )}



          </div>



        </div>



      </aside>







      {/* Enhanced Main Content */}



      <main className={`ml-0 flex-1 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-72'}`}>



        <div className="h-full flex flex-col">



          {/* Modern Header */}



          <header className={`sticky top-0 z-30 backdrop-blur-xl border-b shadow-sm ${adminDarkMode ? 'bg-slate-900/90 border-slate-700/60' : 'bg-white/80 border-gray-200/60'}`}>



            <div className="flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4">



              <div className="flex min-w-0 items-center gap-3 sm:gap-4">

                <button

                  type="button"

                  onClick={() => {

                    setSidebarCollapsed(false);

                    setMobileSidebarOpen((v) => !v);

                  }}

                  className="inline-flex rounded-lg border border-gray-200 bg-white p-2 text-gray-700 shadow-sm md:hidden"

                >

                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />

                  </svg>

                </button>



                <div className="flex flex-col">



                  <h1 className={`text-lg font-bold sm:text-2xl lg:text-3xl ${
                    adminDarkMode 
                      ? 'bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent' 
                      : 'bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent'
                  }`}>



                    {localizedTabs.find(tab => tab.id === activeTab)?.label || t('Dashboard')}



                  </h1>



                  <p className={`mt-1 text-xs sm:text-sm ${adminDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{t('Manage your platform with ease')}</p>



                </div>



              </div>



              <div className="flex items-center gap-3" />



            </div>



          </header>







          {/* Enhanced Content Area */}



          <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4">



            {error && (



              <div className="mb-2 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 px-3 py-2 text-sm text-red-700 shadow-lg animate-pulse">



                <div className="flex items-center gap-3">



                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">



                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />



                  </svg>



                  <span className="font-medium">{error}</span>



                </div>



              </div>



            )}



            <div className={`animate-fadeIn admin-content ${activeTab === 'system_settings' ? 'is-system-settings' : ''}`}>



              {renderContent()}



            </div>



          </div>



        </div>



      </main>







      <PropertyDetailsModal



        selectedProperty={selectedProperty}



        propertyDetails={propertyDetails}



        loadingDetails={loadingDetails}



        onClose={closeDetailsModal}



        doAction={doAction}



      />



    </div>



  );



}




import React, { useMemo, useRef, useState } from 'react';
import { getApiBase } from './api.js';
import { MapPin, Home, DollarSign, FileText, Upload, Camera, X, AlertCircle, Loader2, Building, Store, Calendar } from 'lucide-react';

const EMPTY_FORM = {
  city: '',
  subcity: '',
  real_address: '',
  property_type: 'Residential',
  short_description: '',
  description: '',
  rules: '',
  price: '',
  photo_paths: [],
};

export default function PropertyForm({
  onPosted,
  mode = 'create',
  propertyId: targetPropertyId = null,
  requiresPayment = true,
  initialValues = EMPTY_FORM,
  submitAction = null,
  submitLabel = '',
}) {
  const apiBase = useMemo(() => getApiBase(), []);

  const [city, setCity] = useState(initialValues.city || '');
  const [subcity, setSubcity] = useState(initialValues.subcity || '');
  const [realAddress, setRealAddress] = useState(initialValues.real_address || '');
  const [propertyType, setPropertyType] = useState(initialValues.property_type || 'Residential');

  const [shortDescription, setShortDescription] = useState(initialValues.short_description || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [rules, setRules] = useState(initialValues.rules || '');
  const [price, setPrice] = useState(initialValues.price?.toString?.() || '');

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [photoPaths, setPhotoPaths] = useState(Array.isArray(initialValues.photo_paths) ? initialValues.photo_paths : []);
  const [postError, setPostError] = useState('');
  const [posting, setPosting] = useState(false);
  const photoInputRef = useRef(null);

  const propertyTypes = ['Residential', 'Shop for Rent', 'Event Hall'];

  const handleUpload = async (files) => {
    setUploadError('');
    const list = Array.from(files || []);
    if (list.length === 0) return;
    if (photoPaths.length + list.length > 3) {
      setUploadError('You can upload up to 3 photos.');
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      list.forEach((f) => form.append('photos[]', f));

      const res = await fetch(`${apiBase}/upload.php`, {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok !== true) {
        setUploadError(data.error || 'Upload failed');
        return;
      }
      const uploadedPaths = Array.isArray(data.photo_paths) ? data.photo_paths : [];
      setPhotoPaths((prev) => {
        const merged = [...prev, ...uploadedPaths];
        return [...new Set(merged)].slice(0, 3);
      });
    } catch {
      setUploadError('Network error while uploading.');
    } finally {
      setUploading(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (photoPath) => {
    setPhotoPaths((prev) => prev.filter((path) => path !== photoPath));
    setUploadError('');
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const canPost =
    city.trim() &&
    subcity.trim() &&
    realAddress.trim().length > 3 &&
    propertyType &&
    price.toString().trim() &&
    photoPaths.length > 0 &&
    !posting;

  const handlePost = async (e) => {
    e.preventDefault();
    setPostError('');
    if (!canPost) {
      setPostError('Please complete the form and upload at least one photo.');
      return;
    }

    setPosting(true);
    try {
      const action = submitAction || (mode === 'repost' ? 'repost_update' : 'create_pending');
      const payload = {
        city: city.trim(),
        subcity: subcity.trim(),
        real_address: realAddress.trim(),
        property_type: propertyType,
        short_description: shortDescription.trim(),
        description: description.trim(),
        rules: rules.trim(),
        price: Number(price),
        photo_paths: photoPaths,
      };
      if (mode === 'repost') {
        payload.property_id = Number(targetPropertyId);
      }

      const res1 = await fetch(`${apiBase}/properties.php?action=${encodeURIComponent(action)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data1 = await res1.json().catch(() => ({}));
      if (!res1.ok || data1.ok !== true) {
        setPostError(data1.error || 'Failed to save listing');
        return;
      }

      const savedPropertyId = data1.property_id;
      const notifyPosted = () => {
        if (typeof onPosted !== 'function') return;
        try {
          onPosted(savedPropertyId);
        } catch {
          // Parent refresh callback should not break successful save flow.
        }
      };

      if (requiresPayment) {
        notifyPosted();
        const res2 = await fetch(`${apiBase}/chapa_payment_telebirr.php?action=initialize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ property_id: savedPropertyId }),
        });
        const data2 = await res2.json().catch(() => ({}));
        if (!res2.ok || data2.ok !== true) {
          setPostError(data2.error || 'Payment initialization failed');
          return;
        }

        if (data2.payment_page_url) {
          window.location.href = data2.payment_page_url;
          return;
        }

        setPostError('No payment page URL returned.');
        return;
      }

      notifyPosted();
    } catch (error) {
      const detail = (error && typeof error === 'object' && 'message' in error)
        ? String(error.message || '').trim()
        : '';
      setPostError(detail ? `Network error while saving listing: ${detail}` : 'Network error while saving listing.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <form onSubmit={handlePost} className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
            <Building className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold tracking-tight">{mode === 'repost' ? 'Repost Property' : 'List Your Property'}</h3>
            <p className="mt-1 text-blue-100 text-sm">
              {requiresPayment
                ? 'Complete the form below and pay to activate your listing'
                : 'Update details and submit for approval'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Location Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-blue-100 p-2">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900">Location</h4>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
              <input 
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                placeholder="e.g., Addis Ababa" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sub-city / Neighborhood</label>
              <input 
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
                value={subcity} 
                onChange={(e) => setSubcity(e.target.value)} 
                placeholder="e.g., Bole" 
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Real Address</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={realAddress}
                onChange={(e) => setRealAddress(e.target.value)}
                placeholder="Exact location beyond just city/sub-city"
              />
            </div>
          </div>
        </div>

        {/* Property Details Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-purple-100 p-2">
              <Home className="h-5 w-5 text-purple-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900">Property Details</h4>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Property Type</label>
              <select className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                {propertyTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {propertyType === 'Event Hall' ? 'Daily Price (ETB)' : 'Monthly Price (ETB)'}
              </label>
              <input 
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                inputMode="decimal" 
                placeholder={propertyType === 'Event Hall' ? 'e.g., 5000' : 'e.g., 4500'} 
              />
              {propertyType === 'Event Hall' && (
                <p className="text-xs text-gray-500 mt-1">Event halls are priced per day</p>
              )}
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-green-100 p-2">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900">Description</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Short Description</label>
              <input 
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
                value={shortDescription} 
                onChange={(e) => setShortDescription(e.target.value)} 
                placeholder="Brief description for listing cards" 
                maxLength={100}
              />
              <div className="text-xs text-slate-500 mt-1 text-right">{shortDescription.length}/100</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Detailed Description</label>
              <textarea 
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Describe your property in detail..." 
                rows={4}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Rental Rules</label>
              <textarea 
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none" 
                value={rules} 
                onChange={(e) => setRules(e.target.value)} 
                placeholder="Payment terms, pet policy, etc..." 
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Photos Section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-orange-100 p-2">
              <Camera className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-900">Photos</h4>
              <p className="text-sm text-slate-500">Upload up to 3 photos</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
              <input
                className="hidden"
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                ref={photoInputRef}
                onChange={(e) => handleUpload(e.target.files)}
                disabled={uploading || photoPaths.length >= 3}
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                    <p className="text-slate-600">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-3">
                      <Upload className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-slate-900 font-medium">Click to upload photos</p>
                      <p className="text-sm text-slate-500">
                        {photoPaths.length >= 3 ? 'Maximum of 3 photos reached' : 'or drag and drop'}
                      </p>
                    </div>
                  </div>
                )}
              </label>
            </div>
            
            {uploadError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              </div>
            )}
            
            {photoPaths.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {photoPaths.map((p, index) => (
                  <div key={p} className="relative group">
                    <img 
                      src={p} 
                      alt={`Photo ${index + 1}`} 
                      className="w-full h-24 object-cover rounded-lg border border-slate-200" 
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(p)}
                      className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                      aria-label={`Remove photo ${index + 1}`}
                      title="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {postError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">Error</p>
              <p className="text-sm text-red-700">{postError}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200">
          <button 
            type="button" 
            className="flex-1 rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2" 
            onClick={() => {
              setPhotoPaths(Array.isArray(initialValues.photo_paths) ? initialValues.photo_paths : []);
              setUploadError('');
              setPostError('');
              setShortDescription(initialValues.short_description || '');
              setDescription(initialValues.description || '');
              setRules(initialValues.rules || '');
              setRealAddress(initialValues.real_address || '');
              setCity(initialValues.city || '');
              setSubcity(initialValues.subcity || '');
              setPrice(initialValues.price?.toString?.() || '');
              setPropertyType(initialValues.property_type || 'Residential');
            }}
          >
            <X className="h-4 w-4" />
            Clear Form
          </button>
          <button 
            disabled={!canPost} 
            className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2" 
            type="submit"
          >
            {posting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4" />
                {submitLabel || (requiresPayment ? 'Post & Pay to Activate' : 'Submit for Approval')}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

